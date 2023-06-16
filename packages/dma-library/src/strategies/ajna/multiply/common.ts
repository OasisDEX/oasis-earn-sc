import { ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { CollectFeeFrom } from '@dma-common/types'
import { areAddressesEqual } from '@dma-common/utils/addresses/index'
import { calculateFee } from '@dma-common/utils/swap'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import { prepareAjnaDMAPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
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
import { Amount } from '@domain'
import BigNumber from 'bignumber.js'

export async function simulateAdjustment(
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
  riskIsIncreasing: boolean,
  oraclePrice: BigNumber,
  positionType: PositionType,
) {
  const preFlightTokenMaxDecimals = riskIsIncreasing
    ? args.quoteTokenPrecision
    : args.collateralTokenPrecision
  const preFlightSwapAmount$ = new Amount({
    amount: ONE,
    precision: { mode: 'none', tokenMaxDecimals: preFlightTokenMaxDecimals },
  })
    .switchPrecisionMode('tokenMax')
    .toBigNumber()

  const fromToken = buildFromToken({ ...args, position }, riskIsIncreasing)
  const toToken = buildToToken({ ...args, position }, riskIsIncreasing)
  const fee = SwapUtils.feeResolver(fromToken.symbol, toToken.symbol, {
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
      swapAmountBeforeFees$: preFlightSwapAmount$,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
    },
  })

  const preFlightFromAmount$$ = new Amount({
    amount: preFlightSwapData.fromTokenAmount,
    precision: {
      mode: 'tokenMax',
      tokenMaxDecimals: fromToken.precision,
    },
  })
    .switchPrecisionMode('normalized')
    .toBigNumber()

  const preFlightToAmount$$ = new Amount({
    amount: preFlightSwapData.toTokenAmount,
    precision: {
      mode: 'tokenMax',
      tokenMaxDecimals: toToken.precision,
    },
  })
    .switchPrecisionMode('normalized')
    .toBigNumber()

  // The adjust logic expects market price in the form of
  // the price of collateral with respect to debt
  // So, when risk is decreasing we need to invert the price
  const preFlightMarketPrice = riskIsIncreasing
    ? preFlightFromAmount$$.div(preFlightToAmount$$)
    : preFlightToAmount$$.div(preFlightFromAmount$$)

  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: fromToken.symbol,
    toTokenSymbol: toToken.symbol,
  })

  const positionAdjustArgs = {
    toDeposit: {
      collateral: args.collateralAmount$,
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
  }

  // TODO: Refactor AjnaPosition to extend IPositionV2 (eventually)
  const mappedPosition = {
    debt: {
      // Adjust logic expects tokenMax form for current collateral amount
      amount: new Amount({
        amount: position.debtAmount,
        precision: {
          mode: 'none',
          tokenMaxDecimals: args.quoteTokenPrecision,
        },
      })
        .switchPrecisionMode('tokenMax')
        .toBigNumber(),
      symbol: position.pool.quoteToken,
      precision: args.quoteTokenPrecision,
    },
    collateral: {
      // Adjust logic expects tokenMax form for current collateral amount
      amount: new Amount({
        amount: position.collateralAmount,
        precision: {
          mode: 'none',
          tokenMaxDecimals: args.collateralTokenPrecision,
        },
      })
        .switchPrecisionMode('tokenMax')
        .toBigNumber(),
      symbol: position.pool.collateralToken,
      precision: args.collateralTokenPrecision,
    },
    riskRatio: position.riskRatio,
  }

  return Domain.adjustToTargetRiskRatio(mappedPosition, args.riskRatio, positionAdjustArgs)
}

export async function getSwapData(
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
  riskIsIncreasing: boolean,
  positionType: PositionType,
) {
  const swapAmountBeforeFees$ = simulatedAdjust.swap.fromTokenAmount
  const fee = SwapUtils.feeResolver(
    simulatedAdjust.position.collateral.symbol,
    simulatedAdjust.position.debt.symbol,
    {
      isIncreasingRisk: riskIsIncreasing,
      // Strategy is called open multiply (not open earn)
      isEarnPosition: positionType === 'Earn',
    },
  )
  const { swapData, collectFeeFrom, preSwapFee$ } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    string
  >({
    args: {
      fromToken: buildFromToken(args, riskIsIncreasing),
      toToken: buildToToken(args, riskIsIncreasing),
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees$: swapAmountBeforeFees$,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
    },
  })

  return { swapData, collectFeeFrom, preSwapFee$ }
}

export function prepareAjnaMultiplyDMAPayload(
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  simulatedAdjustment: Domain.ISimulationV2 & Domain.WithSwap,
  operation: IOperation,
  swapData: SwapData,
  collectFeeFrom: CollectFeeFrom,
  preSwapFee$: BigNumber,
  riskIsIncreasing: boolean,
) {
  const collateralAmount = new Amount({
    amount: simulatedAdjustment.position.collateral.amount,
    precision: {
      mode: 'tokenMax',
      tokenMaxDecimals: simulatedAdjustment.position.collateral.precision,
    },
  })
    .switchPrecisionMode('none')
    .toBigNumber()

  const debtAmount = new Amount({
    amount: simulatedAdjustment.position.debt.amount,
    precision: {
      mode: 'tokenMax',
      tokenMaxDecimals: simulatedAdjustment.position.debt.precision,
    },
  })
    .switchPrecisionMode('none')
    .toBigNumber()

  const targetPosition = new AjnaPosition(
    args.position.pool,
    args.dpmProxyAddress,
    collateralAmount,
    debtAmount,
    args.collateralPrice,
    args.quotePrice,
  )

  const isDepositingEth = areAddressesEqual(args.position.pool.collateralToken, dependencies.WETH)
  const txAmount = new Amount({
    amount: args.collateralAmount$,
    precision: {
      mode: 'tokenMax',
      tokenMaxDecimals: TYPICAL_PRECISION,
    },
  })
    .switchPrecisionMode('none')
    .toBigNumber()

  const fromTokenSymbol = riskIsIncreasing ? args.quoteTokenSymbol : args.collateralTokenSymbol
  const toTokenSymbol = riskIsIncreasing ? args.collateralTokenSymbol : args.quoteTokenSymbol
  const fee = SwapUtils.feeResolver(fromTokenSymbol, toTokenSymbol, {
    isIncreasingRisk: riskIsIncreasing,
    isEarnPosition: false,
  })
  const postSwapFee$ =
    collectFeeFrom === 'sourceToken' ? ZERO : calculateFee(swapData.toTokenAmount, fee.toNumber())
  const tokenFee$ = preSwapFee$.plus(postSwapFee$)

  return prepareAjnaDMAPayload({
    swaps: [{ ...swapData, collectFeeFrom, tokenFee$ }],
    dependencies,
    targetPosition,
    data: encodeOperation(operation, dependencies),
    errors: [],
    warnings: [],
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
