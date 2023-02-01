import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { memoizeWith } from 'ramda'

import aavePriceOracleABI from '../../../../../abi/external/aave/v2/priceOracle.json'
import aaveProtocolDataProviderABI from '../../../../../abi/external/aave/v2/protocolDataProvider.json'
import { amountFromWei, amountToWei, calculateFee } from '../../helpers'
import { ADDRESSES } from '../../helpers/addresses'
import { Position } from '../../helpers/calculations/Position'
import {
  DEFAULT_FEE,
  FEE_BASE,
  FLASHLOAN_SAFETY_MARGIN,
  ONE,
  TYPICAL_PRECISION,
  ZERO,
} from '../../helpers/constants'
import { getSwapDataHelper } from '../../helpers/swap/getSwapData'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/v2'
import {
  IBasePositionTransitionArgs,
  IOperation,
  IPositionTransition,
  IPositionTransitionDependencies,
  SwapData,
  WithLockedCollateral,
} from '../../types'
import { AAVETokens } from '../../types/aave'
import { getAaveTokenAddresses } from './getAaveTokenAddresses'

type AaveCloseArgs = IBasePositionTransitionArgs<AAVETokens> & WithLockedCollateral
type AaveCloseDependencies = IPositionTransitionDependencies<AAVEStrategyAddresses>

export async function close(
  args: AaveCloseArgs,
  dependencies: AaveCloseDependencies,
): Promise<IPositionTransition> {
  const { swapData, collectFeeFrom, preSwapFee } = await getSwapDataHelper({
    fromTokenIsDebt: false,
    args: {
      ...args,
      swapAmountBeforeFees: args.collateralAmountLockedInProtocolInWei,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddresses: getAaveTokenAddresses,
    },
  })
  const operation = await buildOperation(swapData, collectFeeFrom, args, dependencies)

  return generateTransition(swapData, collectFeeFrom, preSwapFee, operation, args, dependencies)
}

async function buildOperation(
  swapData: SwapData,
  collectSwapFeeFrom: 'sourceToken' | 'targetToken',
  args: AaveCloseArgs,
  dependencies: AaveCloseDependencies,
): Promise<IOperation> {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const [aaveFlashloanDaiPriceInEth, aaveCollateralTokenPriceInEth, , reserveDataForFlashloan] =
    await getValuesFromProtocol(collateralTokenAddress, debtTokenAddress, dependencies)

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
    lockedCollateralAmountInWei: args.collateralAmountLockedInProtocolInWei,
    flashloanAmount: amountToFlashloanInWei,
    fee: DEFAULT_FEE,
    swapData: swapData.exchangeCalldata,
    receiveAtLeast: swapData.minToTokenAmount,
    proxy: dependencies.proxy,
    collectFeeFrom: collectSwapFeeFrom,
    collateralTokenAddress,
    collateralIsEth: args.collateralToken.symbol === 'ETH',
    debtTokenAddress,
    debtTokenIsEth: args.debtToken.symbol === 'ETH',
    isDPMProxy: dependencies.isDPMProxy,
  }
  return await operations.aave.close(closeArgs, dependencies.addresses)
}

async function generateTransition(
  swapData: SwapData,
  collectFeeFrom: 'sourceToken' | 'targetToken',
  preSwapFee: BigNumber,
  operation: IOperation,
  args: AaveCloseArgs,
  dependencies: AaveCloseDependencies,
) {
  const currentPosition = dependencies.currentPosition
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const [, aaveCollateralTokenPriceInEth, aaveDebtTokenPriceInEth] = await getValuesFromProtocol(
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
  collateralTokenAddress: string,
  debtTokenAddress: string,
  dependencies: AaveCloseDependencies,
) {
  /* Grabs all the protocol level services we need to resolve values */
  const { aavePriceOracle, aaveProtocolDataProvider } = getAAVEProtocolServices(
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

function getAAVEProtocolServices(provider: Provider, addresses: AAVEStrategyAddresses) {
  const aavePriceOracle = new ethers.Contract(addresses.priceOracle, aavePriceOracleABI, provider)

  const aaveProtocolDataProvider = new ethers.Contract(
    addresses.protocolDataProvider,
    aaveProtocolDataProviderABI,
    provider,
  )

  return {
    aavePriceOracle,
    aaveProtocolDataProvider,
  }
}
