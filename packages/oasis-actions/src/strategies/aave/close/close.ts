import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { memoizeWith } from 'ramda'

import aavePriceOracleABI from '../../../../../../abi/external/aave/v2/priceOracle.json'
import aaveProtocolDataProviderABI from '../../../../../../abi/external/aave/v2/protocolDataProvider.json'
import aaveV3PriceOracleABI from '../../../../../../abi/external/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '../../../../../../abi/external/aave/v3/aaveProtocolDataProvider.json'
import { amountFromWei, amountToWei, calculateFee } from '../../../helpers'
import { ADDRESSES } from '../../../helpers/addresses'
import { Position } from '../../../helpers/calculations/Position'
import {
  DEFAULT_FEE,
  FEE_BASE,
  FLASHLOAN_SAFETY_MARGIN,
  ONE,
  TEN,
  TYPICAL_PRECISION,
  ZERO,
} from '../../../helpers/constants'
import { acceptedFeeToken } from '../../../helpers/swap/acceptedFeeToken'
import { feeResolver } from '../../../helpers/swap/feeResolver'
import * as operations from '../../../operations'
import { AAVEStrategyAddresses } from '../../../operations/aave/v2'
import { AAVEV3StrategyAddresses } from '../../../operations/aave/v3'
import {
  IBasePositionTransitionArgs,
  IOperation,
  IPositionTransition,
  IPositionTransitionDependencies,
  SwapData,
  WithLockedCollateral,
} from '../../../types'
import { AAVETokens } from '../../../types/aave'
import { getAaveTokenAddresses } from '../getAaveTokenAddresses'
import { AaveVersion } from '../getCurrentPosition'

export type AaveCloseArgs = IBasePositionTransitionArgs<AAVETokens> &
  WithLockedCollateral & {
    shouldCloseToCollateral?: boolean
  }

type WithVersioning = {
  protocolVersion: AaveVersion
}

type AaveCloseArgsWithVersioning = AaveCloseArgs & WithVersioning

export type AaveCloseDependencies =
  | IPositionTransitionDependencies<AAVEStrategyAddresses>
  | IPositionTransitionDependencies<AAVEV3StrategyAddresses>

export async function close(
  args: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
): Promise<IPositionTransition> {
  const getSwapData = args.shouldCloseToCollateral
    ? getSwapDataToCloseToCollateral
    : getSwapDataToCloseToDebt

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(args, dependencies)
  const operation = await buildOperation({ ...swapData, collectFeeFrom }, args, dependencies)

  return generateTransition(swapData, collectFeeFrom, preSwapFee, operation, args, dependencies)
}

async function getSwapDataToCloseToCollateral(
  { debtToken, collateralToken, slippage, protocolVersion }: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
) {
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

  // Since we cannot get the exact amount that will be needed
  // to cover all debt, there will be left overs of the debt token
  // which will then have to be transferred back to the user
  // In order to skip that step we won't add any fee per see but rather
  // add the fee to the amount needed for the swap, cover all the debt
  // and the remaining of the debt token will be send to our fee beneficiary address

  let [, colPrice, debtPrice] = (
    await getValuesFromProtocol(
      protocolVersion,
      collateralTokenAddress,
      debtTokenAddress,
      dependencies,
    )
  ).map(price => {
    return new BigNumber(price.toString())
  })
  // 1.Use offset amount which will be used in the swap as well.
  // The idea is that after the debt is paid, the remaining will be transferred to the beneficiary
  // Debt is a complex number and interest rate is constantly applied.
  // We don't want to end up having leftovers of debt transferred to the user
  // so instead of charging the user a fee, we add an offset ( equal to the fee ) to the
  // collateral amount. That way when swapped for the debt token, the remaining debt amount
  // after paying back the debt, will contain the fee amount itself.
  const fee = new BigNumber(DEFAULT_FEE).div(new BigNumber(FEE_BASE)) // as DECIMAL number
  const debtTokenPrecision = debtToken.precision || TYPICAL_PRECISION
  const collateralTokenPrecision = collateralToken.precision || TYPICAL_PRECISION

  // 2. Calculated the needed amount of collateral to payback the debt
  // This value is calculated based on the AAVE protocol oracles.
  // At the time of writing, their main source are Chainlink oracles.
  const collateralNeeded = calculateNeededCollateralToPaybackDebt(
    debtPrice,
    debtTokenPrecision,
    colPrice,
    collateralTokenPrecision,
    dependencies.currentPosition.debt.amount,
    fee,
    slippage,
  )

  // 3 Get latest market price
  // If you check i.e. https://data.chain.link/ethereum/mainnet/stablecoins/usdc-eth ,
  // there is a deviation threshold value that shows how much the prices on/off chain might differ
  // When there is a 1inch swap, we use real-time market price. To calculate that,
  // A preflight request is sent to calculate the existing market price.
  const debtPricePreflightSwapData = await dependencies.getSwapData(
    debtTokenAddress,
    ADDRESSES.main.ETH,
    dependencies.currentPosition.debt.amount,
    slippage,
  )

  const colPricePreflightSwapData = await dependencies.getSwapData(
    collateralTokenAddress,
    ADDRESSES.main.ETH,
    collateralNeeded,
    slippage,
  )

  debtPrice = new BigNumber(
    debtPricePreflightSwapData.toTokenAmount
      .div(debtPricePreflightSwapData.fromTokenAmount)
      .times(TEN.pow(debtTokenPrecision))
      .toFixed(0),
  )

  colPrice = new BigNumber(
    colPricePreflightSwapData.toTokenAmount
      .div(colPricePreflightSwapData.fromTokenAmount)
      .times(TEN.pow(collateralTokenPrecision))
      .toFixed(0),
  )

  // 4. Get Swap Data
  // This is the actual swap data that will be used in the transaction.
  const swapData = await dependencies.getSwapData(
    collateralTokenAddress,
    debtTokenAddress,
    calculateNeededCollateralToPaybackDebt(
      debtPrice,
      debtTokenPrecision,
      colPrice,
      collateralTokenPrecision,
      dependencies.currentPosition.debt.amount,
      fee,
      slippage,
    ),
    slippage,
  )

  return {
    swapData,
    collectFeeFrom: acceptedFeeToken({
      fromToken: collateralTokenAddress,
      toToken: debtTokenAddress,
    }),
    preSwapFee: ZERO,
  }
}

async function getSwapDataToCloseToDebt(
  { debtToken, collateralToken, slippage, collateralAmountLockedInProtocolInWei }: AaveCloseArgs,
  dependencies: AaveCloseDependencies,
) {
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

  const swapAmountBeforeFees = collateralAmountLockedInProtocolInWei

  const collectFeeFrom = acceptedFeeToken({
    fromToken: collateralTokenAddress,
    toToken: debtTokenAddress,
  })

  const preSwapFee =
    collectFeeFrom === 'sourceToken'
      ? calculateFee(swapAmountBeforeFees, new BigNumber(DEFAULT_FEE), new BigNumber(FEE_BASE))
      : ZERO

  const swapAmountAfterFees = swapAmountBeforeFees
    .minus(preSwapFee)
    .integerValue(BigNumber.ROUND_DOWN)

  const swapData = await dependencies.getSwapData(
    collateralTokenAddress,
    debtTokenAddress,
    swapAmountAfterFees,
    slippage,
  )

  return { swapData, collectFeeFrom, preSwapFee }
}

function calculateNeededCollateralToPaybackDebt(
  debtPrice: BigNumber,
  debtPrecision: number,
  colPrice: BigNumber,
  colPrecision: number,
  debtAmount: BigNumber,
  fee: BigNumber,
  slippage: BigNumber,
) {
  // Depending on the protocol the price  could be anything.
  // i.e AAVEv3 returns the prices in USD
  //     AAVEv2 returns the prices in ETH
  // @paybackAmount - the amount denominated in the protocol base currency ( i.e. AAVEv2 - It will be in ETH, AAVEv3 - USDC)
  const paybackAmount = debtPrice.times(debtAmount)
  const paybackAmountInclFee = paybackAmount.times(ONE.plus(fee))
  // Same rule applies for @collateralAmountNeeded. @colPrice is either in USDC ( AAVEv3 ) or ETH ( AAVEv2 )
  // or could be anything eles in the following versions.
  const collateralAmountNeeded = new BigNumber(
    paybackAmount
      .plus(paybackAmount.times(fee))
      .plus(paybackAmountInclFee.times(slippage))
      .div(colPrice),
  ).integerValue(BigNumber.ROUND_DOWN)
  return collateralAmountNeeded.times(TEN.pow(colPrecision - debtPrecision))
}

async function buildOperation(
  swapData: SwapData & {
    collectFeeFrom: 'sourceToken' | 'targetToken'
  },
  args: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
): Promise<IOperation> {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const [aaveFlashloanDaiPriceInEth, aaveCollateralTokenPriceInEth, , reserveDataForFlashloan] =
    await getValuesFromProtocol(
      args.protocolVersion,
      collateralTokenAddress,
      debtTokenAddress,
      dependencies,
    )

  /* Calculate Amount to flashloan */
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)
  const ethPerDAI = new BigNumber(aaveFlashloanDaiPriceInEth.toString())
  const ethPerCollateralToken = new BigNumber(aaveCollateralTokenPriceInEth.toString())
  // EG STETH/ETH divided by ETH/DAI = STETH/ETH times by DAI/ETH = STETH/DAI
  const oracleFLtoCollateralToken = ethPerCollateralToken.div(ethPerDAI)

  const amountToFlashloanInWei = amountToWei(
    amountFromWei(args.collateralAmountLockedInProtocolInWei, args.collateralToken.precision).times(
      oracleFLtoCollateralToken,
    ),
    18,
  )
    .div(maxLoanToValueForFL.times(ONE.minus(FLASHLOAN_SAFETY_MARGIN)))
    .integerValue(BigNumber.ROUND_DOWN)

  const closeArgs = {
    lockedCollateralAmountInWei: args.shouldCloseToCollateral
      ? swapData.fromTokenAmount
      : args.collateralAmountLockedInProtocolInWei,
    flashloanAmount: amountToFlashloanInWei,
    fee: args.shouldCloseToCollateral
      ? 0
      : feeResolver(args.collateralToken.symbol, args.debtToken.symbol).toNumber(),
    swapData: swapData.exchangeCalldata,
    receiveAtLeast: swapData.minToTokenAmount,
    proxy: dependencies.proxy,
    collectFeeFrom: swapData.collectFeeFrom,
    collateralTokenAddress,
    collateralIsEth: args.collateralToken.symbol === 'ETH',
    debtTokenAddress,
    debtTokenIsEth: args.debtToken.symbol === 'ETH',
    isDPMProxy: dependencies.isDPMProxy,
    shouldCloseToCollateral: args.shouldCloseToCollateral || false,
  }

  switch (args.protocolVersion) {
    case AaveVersion.v2:
      return await operations.aave.v2.close(
        closeArgs,
        dependencies.addresses as AAVEStrategyAddresses,
      )
    case AaveVersion.v3:
      return await operations.aave.v3.close(
        closeArgs,
        dependencies.addresses as AAVEV3StrategyAddresses,
      )
    default:
      throw new Error('Unsupported AAVE verison')
  }
}

async function generateTransition(
  swapData: SwapData,
  collectFeeFrom: 'sourceToken' | 'targetToken',
  preSwapFee: BigNumber,
  operation: IOperation,
  args: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
) {
  const currentPosition = dependencies.currentPosition
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const [, aaveCollateralTokenPriceInEth, aaveDebtTokenPriceInEth] = await getValuesFromProtocol(
    args.protocolVersion,
    collateralTokenAddress,
    debtTokenAddress,
    dependencies,
  )
  /*
  Final position calculated using actual swap data and the latest market price
 */
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)
  const finalPosition = new Position(
    { amount: ZERO, symbol: currentPosition.debt.symbol },
    { amount: ZERO, symbol: currentPosition.collateral.symbol },
    oracle,
    currentPosition.category,
  )

  const flags = { requiresFlashloan: true, isIncreasingRisk: false }

  // We need to calculate a fee from the total locked collateral
  // Then convert this amount into the debt token
  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)
  const postSwapFee =
    collectFeeFrom === 'targetToken'
      ? calculateFee(
          dependencies.currentPosition.collateral.amount.div(actualMarketPriceWithSlippage),
          new BigNumber(DEFAULT_FEE),
          new BigNumber(FEE_BASE),
        )
      : ZERO

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: {
        debt: currentPosition.debt.amount.negated(),
        collateral: currentPosition.collateral.amount.negated(),
        flashloanAmount: ZERO,
      },
      flags: flags,
      swap: {
        ...swapData,
        tokenFee: preSwapFee.plus(postSwapFee),
        collectFeeFrom,
        sourceToken: {
          symbol: args.collateralToken.symbol,
          precision: args.collateralToken.precision ?? TYPICAL_PRECISION,
        },
        targetToken: {
          symbol: args.debtToken.symbol,
          precision: args.debtToken.precision ?? TYPICAL_PRECISION,
        },
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
    },
  }
}

async function getValuesFromProtocol(
  protocolVersion: AaveVersion,
  collateralTokenAddress: string,
  debtTokenAddress: string,
  dependencies: AaveCloseDependencies,
) {
  /* Grabs all the protocol level services we need to resolve values */
  const { aavePriceOracle, aaveProtocolDataProvider } = getAAVEProtocolServices(
    protocolVersion,
    dependencies.provider,
    dependencies.addresses,
  )

  async function getAllAndMemoize() {
    return Promise.all([
      aavePriceOracle.getAssetPrice(ADDRESSES.main.DAI),
      aavePriceOracle.getAssetPrice(collateralTokenAddress),
      aavePriceOracle.getAssetPrice(debtTokenAddress),
      aaveProtocolDataProvider.getReserveConfigurationData(ADDRESSES.main.DAI),
    ])
  }

  return memoizeWith(() => collateralTokenAddress, getAllAndMemoize)()
}

function getAAVEProtocolServices(
  protocolVersion: AaveVersion,
  provider: Provider,
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
) {
  switch (protocolVersion) {
    case AaveVersion.v2:
      return {
        aavePriceOracle: new ethers.Contract(
          (addresses as AAVEStrategyAddresses).priceOracle,
          aavePriceOracleABI,
          provider,
        ),
        aaveProtocolDataProvider: new ethers.Contract(
          (addresses as AAVEStrategyAddresses).protocolDataProvider,
          aaveProtocolDataProviderABI,
          provider,
        ),
      }
    case AaveVersion.v3:
      return {
        aavePriceOracle: new ethers.Contract(
          (addresses as AAVEV3StrategyAddresses).aaveOracle,
          aaveV3PriceOracleABI,
          provider,
        ),
        aaveProtocolDataProvider: new ethers.Contract(
          (addresses as AAVEV3StrategyAddresses).aaveProtocolDataProvider,
          aaveV3ProtocolDataProviderABI,
          provider,
        ),
      }
    default:
      throw new Error('Unsupported AAVE Version')
  }
}
