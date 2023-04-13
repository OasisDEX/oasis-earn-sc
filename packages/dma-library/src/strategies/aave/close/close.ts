import * as operations from '@dma-library/operations'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import {
  IBasePositionTransitionArgs,
  IOperation,
  IPositionTransitionDependencies,
  PositionTransition,
  SwapData,
  WithLockedCollateral,
} from '@dma-library/types'
import { AAVETokens } from '@dma-library/types/aave'
import { acceptedFeeToken } from '@dma-library/utils/swap/accepted-fee-token'
import { feeResolver } from '@dma-library/utils/swap/fee-resolver'
import { Provider } from '@ethersproject/providers'
import aavePriceOracleABI from '@oasisdex/abis/external/protocols/aave/v2/priceOracle.json'
import aaveProtocolDataProviderABI from '@oasisdex/abis/external/protocols/aave/v2/protocolDataProvider.json'
import aaveV3PriceOracleABI from '@oasisdex/abis/external/protocols/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '@oasisdex/abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import { ADDRESSES } from '@oasisdex/addresses'
import {
  FEE_BASE,
  FEE_ESTIMATE_INFLATOR,
  ONE,
  TEN,
  TYPICAL_PRECISION,
  ZERO,
} from '@oasisdex/dma-common/constants'
import { amountFromWei, amountToWei } from '@oasisdex/dma-common/utils/common'
import { calculateFee } from '@oasisdex/dma-common/utils/swap'
import { FLASHLOAN_SAFETY_MARGIN, Position } from '@oasisdex/domain/src'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { memoizeWith } from 'ramda'

import { getAaveTokenAddresses } from '../get-aave-token-addresses'
import { AaveVersion } from '../get-current-position'

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
): Promise<PositionTransition> {
  const getSwapData = args.shouldCloseToCollateral
    ? getSwapDataToCloseToCollateral
    : getSwapDataToCloseToDebt

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(args, dependencies)

  const operation = await buildOperation(
    { ...swapData, collectFeeFrom, preSwapFee },
    args,
    dependencies,
  )

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
  // collateral amount. This means irrespective of whether the fee is collected before
  // or after the swap, there will always be sufficient debt token remaining to cover the outstanding position debt.
  const fee = feeResolver(collateralToken.symbol, debtToken.symbol) // as DECIMAL number
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
    ADDRESSES.mainnet.common.ETH,
    dependencies.currentPosition.debt.amount,
    slippage,
  )

  const colPricePreflightSwapData = await dependencies.getSwapData(
    collateralTokenAddress,
    ADDRESSES.mainnet.common.ETH,
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
  const amountNeededToEnsureRemainingDebtIsRepaid = calculateNeededCollateralToPaybackDebt(
    debtPrice,
    debtTokenPrecision,
    colPrice,
    collateralTokenPrecision,
    dependencies.currentPosition.debt.amount,
    fee.div(FEE_BASE),
    slippage,
  )

  const swapData = await dependencies.getSwapData(
    collateralTokenAddress,
    debtTokenAddress,
    amountNeededToEnsureRemainingDebtIsRepaid,
    slippage,
  )

  const collectFeeFrom = acceptedFeeToken({
    fromToken: collateralTokenAddress,
    toToken: debtTokenAddress,
  })

  const preSwapFee =
    collectFeeFrom === 'sourceToken'
      ? calculateFee(amountNeededToEnsureRemainingDebtIsRepaid, fee.toNumber())
      : ZERO

  return {
    swapData,
    collectFeeFrom,
    preSwapFee,
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

  const fee = feeResolver(collateralToken.symbol, debtToken.symbol)

  const preSwapFee =
    collectFeeFrom === 'sourceToken' ? calculateFee(swapAmountBeforeFees, fee.toNumber()) : ZERO

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
    preSwapFee: BigNumber
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

  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol)

  const closeArgs = {
    // In the close to collateral scenario we need to add the preSwapFee amount to the fromTokenAmount
    // So, that when taking the fee from the source token we are sending the Swap contract
    // the sum of the fee and the ultimately fromAmount that will be swapped
    lockedCollateralAmountInWei: args.shouldCloseToCollateral
      ? swapData.fromTokenAmount.plus(swapData.preSwapFee)
      : args.collateralAmountLockedInProtocolInWei,
    flashloanAmount: amountToFlashloanInWei,
    fee: fee.toNumber(),
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
      throw new Error('Unsupported AAVE version')
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

  // We need to estimate the fee due when collecting from the target token
  // We use the toTokenAmount given it's the most optimistic swap scenario
  // Meaning it corresponds with the largest fee a user can expect to pay
  // Thus, if the swap performs poorly the fee will be less than expected
  const fromTokenAmountNormalised = amountFromWei(
    swapData.fromTokenAmount,
    args.collateralToken.precision,
  )
  const toTokenAmountNormalisedWithMaxSlippage = amountFromWei(
    swapData.minToTokenAmount,
    args.debtToken.precision,
  )

  const expectedMarketPriceWithSlippage = fromTokenAmountNormalised.div(
    toTokenAmountNormalisedWithMaxSlippage,
  )
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol)

  const postSwapFee =
    collectFeeFrom === 'targetToken' ? calculateFee(swapData.toTokenAmount, fee.toNumber()) : ZERO

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
        tokenFee: preSwapFee.plus(
          postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
        ),
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
        expectedMarketPriceWithSlippage,
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
      aavePriceOracle.getAssetPrice(ADDRESSES.mainnet.common.DAI),
      aavePriceOracle.getAssetPrice(collateralTokenAddress),
      aavePriceOracle.getAssetPrice(debtTokenAddress),
      aaveProtocolDataProvider.getReserveConfigurationData(ADDRESSES.mainnet.common.DAI),
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
          (addresses as AAVEV3StrategyAddresses).poolDataProvider,
          aaveV3ProtocolDataProviderABI,
          provider,
        ),
      }
    default:
      throw new Error('Unsupported AAVE Version')
  }
}
