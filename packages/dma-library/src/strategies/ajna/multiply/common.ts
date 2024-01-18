import { ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { CollectFeeFrom } from '@dma-common/types'
import { areAddressesEqual } from '@dma-common/utils/addresses/index'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  getNeutralPrice,
  prepareAjnaDMAPayload,
  resolveAjnaEthAction,
} from '@dma-library/protocols/ajna'
import {
  validateBorrowUndercollateralized,
  validateLiquidity,
} from '@dma-library/strategies/ajna/validation'
import { validateLiquidationPriceCloseToMarketPrice } from '@dma-library/strategies/ajna/validation/borrowish/liquidationPriceCloseToMarket'
import { validateDustLimitMultiply } from '@dma-library/strategies/ajna/validation/multiply/dustLimit'
import { validateGenerateCloseToMaxLtv } from '@dma-library/strategies/validation/closeToMaxLtv'
import {
  AjnaMultiplyPayload,
  AjnaPosition,
  IOperation,
  PositionType,
  SwapData,
} from '@dma-library/types'
import { AjnaCommonDMADependencies } from '@dma-library/types/ajna'
import { encodeOperation } from '@dma-library/utils/operation'
import * as SwapUtils from '@dma-library/utils/swap'
import * as Domain from '@domain'
import BigNumber from 'bignumber.js'

export async function simulateAdjustment(
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  riskIsIncreasing: boolean,
  oraclePrice: BigNumber,
  positionType: PositionType,
  __feeOverride?: BigNumber,
) {
  const preFlightTokenMaxDecimals = riskIsIncreasing
    ? args.quoteTokenPrecision
    : args.collateralTokenPrecision
  const preFlightSwapAmount = amountToWei(ONE, preFlightTokenMaxDecimals)

  const fromToken = buildFromToken(args, riskIsIncreasing)
  const toToken = buildToToken(args, riskIsIncreasing)
  const fee =
    __feeOverride ||
    SwapUtils.feeResolver(fromToken.symbol, toToken.symbol, {
      isIncreasingRisk: riskIsIncreasing,
      // Strategy is called open multiply (not open earn)
      isEarnPosition: positionType === 'Earn',
    })
  const { swapData: preFlightSwapData } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    string
  >({
    args: {
      fromToken,
      toToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: preFlightSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
    },
  })

  const normalisedPreFlightFromAmount = amountToWei(
    preFlightSwapData.fromTokenAmount,
    TYPICAL_PRECISION - fromToken.precision,
  )
  const normalisedPreFlightToAmount = amountToWei(
    preFlightSwapData.toTokenAmount,
    TYPICAL_PRECISION - toToken.precision,
  )

  // The adjust logic expects market price in the form of
  // the price of collateral with respect to debt
  // So, when risk is decreasing we need to invert the price
  const preFlightMarketPrice = riskIsIncreasing
    ? normalisedPreFlightFromAmount.div(normalisedPreFlightToAmount)
    : normalisedPreFlightToAmount.div(normalisedPreFlightFromAmount)

  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: fromToken.symbol,
    toTokenSymbol: toToken.symbol,
  })

  const positionAdjustArgs = {
    toDeposit: {
      collateral: args.collateralAmount,
      /** Not relevant for Ajna */
      debt: ZERO,
    },
    fees: {
      oazo: fee,
      flashLoan: BALANCER_FEE,
    },
    prices: {
      oracle: oraclePrice,
      // Get pre-flight market price from 1inch
      market: preFlightMarketPrice,
    },
    slippage: args.slippage,
    options: {
      collectSwapFeeFrom: collectFeeFrom,
    },
    network: dependencies.network,
  }

  // TODO: Refactor AjnaPosition to extend IPositionV2 (eventually)
  const mappedPosition = {
    debt: {
      // Adjust logic expects tokenMax form for current collateral amount
      amount: amountToWei(args.position.debtAmount, args.quoteTokenPrecision),
      symbol: args.position.pool.quoteToken,
      precision: args.quoteTokenPrecision,
    },
    collateral: {
      // Adjust logic expects tokenMax form for current collateral amount
      amount: amountToWei(args.position.collateralAmount, args.collateralTokenPrecision),
      symbol: args.position.pool.collateralToken,
      precision: args.collateralTokenPrecision,
    },
    riskRatio: args.position.riskRatio,
  }

  return Domain.adjustToTargetRiskRatio(mappedPosition, args.riskRatio, positionAdjustArgs)
}

export async function getSwapData(
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
  riskIsIncreasing: boolean,
  positionType: PositionType,
  __feeOverride?: BigNumber,
) {
  const swapAmountBeforeFees = simulatedAdjust.swap.fromTokenAmount
  const fee =
    __feeOverride ||
    SwapUtils.feeResolver(
      simulatedAdjust.position.collateral.symbol,
      simulatedAdjust.position.debt.symbol,
      {
        isIncreasingRisk: riskIsIncreasing,
        // Strategy is called open multiply (not open earn)
        isEarnPosition: positionType === 'Earn',
      },
    )
  const { swapData, collectFeeFrom, preSwapFee } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    string
  >({
    args: {
      fromToken: buildFromToken(args, riskIsIncreasing),
      toToken: buildToToken(args, riskIsIncreasing),
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: swapAmountBeforeFees,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
    },
  })

  return { swapData, collectFeeFrom, preSwapFee }
}

export function prepareAjnaMultiplyDMAPayload(
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  simulatedAdjustment: Domain.ISimulationV2 & Domain.WithSwap,
  operation: IOperation,
  swapData: SwapData,
  collectFeeFrom: CollectFeeFrom,
  preSwapFee: BigNumber,
  riskIsIncreasing: boolean,
) {
  const collateralAmount = amountFromWei(
    simulatedAdjustment.position.collateral.amount,
    simulatedAdjustment.position.collateral.precision,
  )
  const debtAmount = amountFromWei(
    simulatedAdjustment.position.debt.amount,
    simulatedAdjustment.position.debt.precision,
  )

  const targetPosition = new AjnaPosition(
    args.position.pool,
    args.dpmProxyAddress,
    collateralAmount,
    debtAmount,
    args.collateralPrice,
    args.quotePrice,
    getNeutralPrice(debtAmount, collateralAmount, args.position.pool.interestRate),
    args.position.pnl,
  )

  const isDepositingEth = areAddressesEqual(args.position.pool.collateralToken, dependencies.WETH)
  const txAmount = args.collateralAmount
  const fromTokenSymbol = riskIsIncreasing ? args.quoteTokenSymbol : args.collateralTokenSymbol
  const toTokenSymbol = riskIsIncreasing ? args.collateralTokenSymbol : args.quoteTokenSymbol
  const fee = SwapUtils.feeResolver(fromTokenSymbol, toTokenSymbol, {
    isIncreasingRisk: riskIsIncreasing,
    isEarnPosition: false,
  })
  const postSwapFee =
    collectFeeFrom === 'sourceToken' ? ZERO : calculateFee(swapData.toTokenAmount, fee.toNumber())
  const tokenFee = preSwapFee.plus(postSwapFee)

  // Validation
  const debtTokensDeposited = ZERO // Not relevant for Ajna
  const borrowAmount = simulatedAdjustment.delta.debt
    .minus(debtTokensDeposited)
    .shiftedBy(-args.quoteTokenPrecision)

  const errors = [
    // Add as required...
    ...validateDustLimitMultiply(targetPosition),
    ...validateLiquidity(targetPosition, args.position, borrowAmount),
    ...validateBorrowUndercollateralized(targetPosition, args.position, borrowAmount),
  ]

  const warnings = [
    ...validateGenerateCloseToMaxLtv(targetPosition, args.position),
    ...validateLiquidationPriceCloseToMarketPrice(targetPosition),
  ]

  return prepareAjnaDMAPayload({
    swaps: [{ ...swapData, collectFeeFrom, tokenFee }],
    dependencies,
    targetPosition,
    data: encodeOperation(operation, dependencies),
    errors,
    warnings,
    successes: [],
    notices: [],
    txValue: resolveAjnaEthAction(isDepositingEth, txAmount),
  })
}

export function buildFromToken(args: AjnaMultiplyPayload, isIncreasingRisk: boolean) {
  if (isIncreasingRisk) {
    return {
      symbol: args.quoteTokenSymbol.toUpperCase(),
      address: args.position.pool.quoteToken,
      precision: args.quoteTokenPrecision,
    }
  } else {
    return {
      symbol: args.collateralTokenSymbol.toUpperCase(),
      address: args.position.pool.collateralToken,
      precision: args.collateralTokenPrecision,
    }
  }
}

export function buildToToken(args: AjnaMultiplyPayload, isIncreasingRisk: boolean) {
  if (isIncreasingRisk) {
    return {
      symbol: args.collateralTokenSymbol.toUpperCase(),
      address: args.position.pool.collateralToken,
      precision: args.collateralTokenPrecision,
    }
  } else {
    return {
      symbol: args.quoteTokenSymbol.toUpperCase(),
      address: args.position.pool.quoteToken,
      precision: args.quoteTokenPrecision,
    }
  }
}
