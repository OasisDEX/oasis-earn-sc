import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
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
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import {
  IBasePositionTransitionArgs,
  IPositionTransition,
  IPositionTransitionDependencies,
  WithLockedCollateral,
} from '../types'
import { AAVETokens } from '../types/aave'
import { getAAVETokenAddresses } from './getAAVETokenAddresses'

export async function close(
  args: IBasePositionTransitionArgs<AAVETokens> & WithLockedCollateral,
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const currentPosition = dependencies.currentPosition

  /* Maps from union of token keys to actual address */
  const { collateralTokenAddress, debtTokenAddress } = getAAVETokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  /* Grabs all the protocol level services we need to resolve values */
  const { aavePriceOracle, aaveProtocolDataProvider } = getAAVEProtocolServices(
    dependencies.provider,
    dependencies.addresses,
  )

  /* Swap and fee calculations */
  const swapAmountBeforeFees = args.collateralAmountLockedInProtocolInWei
  const collectFeeFrom = args.collectSwapFeeFrom ?? 'sourceToken'
  const preSwapFee = calculatePreSwapFeeAmount(collectFeeFrom, swapAmountBeforeFees)
  const swapAmountAfterFees = swapAmountBeforeFees
    .minus(preSwapFee)
    .integerValue(BigNumber.ROUND_DOWN)

  /* Resolve protocol values and 1inch call data */
  const [
    aaveFlashloanDaiPriceInEth,
    aaveCollateralTokenPriceInEth,
    swapData,
    reserveDataForFlashloan,
  ] = await Promise.all([
    aavePriceOracle
      .getAssetPrice(ADDRESSES.main.DAI)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    dependencies.getSwapData(
      collateralTokenAddress,
      debtTokenAddress,
      swapAmountAfterFees,
      args.slippage,
    ),
    aaveProtocolDataProvider.getReserveConfigurationData(ADDRESSES.main.DAI),
  ])

  /* Calculate Amount to flashloan */
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

  const ethPerDAI = aaveFlashloanDaiPriceInEth
  const ethPerCollateralToken = aaveCollateralTokenPriceInEth
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

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  // We need to calculate a fee from the total locked collateral
  // Then convert this amount into the debt token
  const postSwapFee =
    collectFeeFrom === 'targetToken'
      ? calculateFee(
          dependencies.currentPosition.collateral.amount.div(actualMarketPriceWithSlippage),
          new BigNumber(DEFAULT_FEE),
          new BigNumber(FEE_BASE),
        )
      : ZERO

  const operation = await operations.aave.close(
    {
      lockedCollateralAmountInWei: args.collateralAmountLockedInProtocolInWei,
      flashloanAmount: amountToFlashloanInWei,
      fee: DEFAULT_FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      proxy: dependencies.proxy,
      collectFeeFrom: collectFeeFrom,
      collateralTokenAddress,
      collateralIsEth: args.collateralToken.symbol === 'ETH',
      debtTokenAddress,
      debtTokenIsEth: args.debtToken.symbol === 'ETH',
      isDPMProxy: dependencies.isDPMProxy,
    },
    dependencies.addresses,
  )

  /*
  Final position calculated using actual swap data and the latest market price
 */
  const finalPosition = new Position(
    { amount: ZERO, symbol: currentPosition.debt.symbol },
    { amount: ZERO, symbol: currentPosition.collateral.symbol },
    aaveCollateralTokenPriceInEth,
    currentPosition.category,
  )

  const flags = { requiresFlashloan: true, isIncreasingRisk: false }

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
        tokenFee: preSwapFee.gt(ZERO) ? preSwapFee : postSwapFee,
        collectFeeFrom: args.collectSwapFeeFrom ?? 'sourceToken',
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

function getAAVEProtocolServices(provider: Provider, addresses: AAVEStrategyAddresses) {
  const aavePriceOracle = new ethers.Contract(
    addresses.aavePriceOracle,
    aavePriceOracleABI,
    provider,
  )

  const aaveProtocolDataProvider = new ethers.Contract(
    addresses.aaveProtocolDataProvider,
    aaveProtocolDataProviderABI,
    provider,
  )

  return {
    aavePriceOracle,
    aaveProtocolDataProvider,
  }
}

function calculatePreSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken',
  swapAmountBeforeFees: BigNumber,
) {
  const preSwapFee =
    collectFeeFrom === 'sourceToken'
      ? calculateFee(swapAmountBeforeFees, new BigNumber(DEFAULT_FEE), new BigNumber(FEE_BASE))
      : ZERO

  return preSwapFee
}
