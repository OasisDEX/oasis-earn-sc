import { FEE_ESTIMATE_INFLATOR, ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { CollectFeeFrom } from '@dma-common/types'
import { calculateFee } from '@dma-common/utils/swap'
import { areSymbolsEqual } from '@dma-common/utils/symbols'
import { operations } from '@dma-library/operations'
import { prepareAjnaDMAPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import * as StrategiesCommon from '@dma-library/strategies/common'
import {
  AjnaPosition,
  FlashloanProvider,
  IOperation,
  PositionType,
  Strategy,
  SwapData,
} from '@dma-library/types'
import {
  AjnaCloseMultiplyPayload,
  AjnaCommonDMADependencies,
} from '@dma-library/types/ajna/ajna-dependencies'
import { encodeOperation } from '@dma-library/utils/operation'
import * as SwapUtils from '@dma-library/utils/swap'
import * as Domain from '@domain'
import { Amount } from '@domain'
import { FLASHLOAN_SAFETY_MARGIN } from '@domain/constants'
import BigNumber from 'bignumber.js'

export type AjnaCloseStrategy = (
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
) => Promise<Strategy<AjnaPosition>>

const positionType: PositionType = 'Multiply'

export const closeMultiply: AjnaCloseStrategy = async (args, dependencies) => {
  const position = args.position
  // Get Swap Data
  const getSwapData = args.shouldCloseToCollateral
    ? getAjnaSwapDataToCloseToCollateral
    : getAjnaSwapDataToCloseToDebt

  const { swapData, collectFeeFrom, preSwapFee$ } = await getSwapData(args, dependencies, position)

  // Build operation
  const operation = await buildOperation(
    args,
    dependencies,
    position,
    swapData,
    preSwapFee$,
    collectFeeFrom,
  )

  // Prepare Payload
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const targetPosition = args.position.close()

  const fee = SwapUtils.feeResolver(
    args.position.pool.collateralToken,
    args.position.pool.quoteToken,
  )

  const postSwapFee$ =
    collectFeeFrom === 'targetToken' ? calculateFee(swapData.toTokenAmount, fee.toNumber()) : ZERO
  const tokenFee$ = preSwapFee$.plus(
    postSwapFee$.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
  )
  return prepareAjnaDMAPayload({
    swaps: [{ ...swapData, collectFeeFrom, tokenFee$ }],
    dependencies,
    targetPosition,
    data: encodeOperation(operation, dependencies),
    errors: [],
    warnings: [],
    successes: [],
    notices: [],
    // TODO instead of zero we will need data from swap
    txValue: resolveAjnaEthAction(isDepositingEth, ZERO),
  })
}

async function getAjnaSwapDataToCloseToDebt(
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
) {
  const swapAmountBeforeFees$ = new Amount({
    amount: position.collateralAmount,
    precision: {
      mode: 'none',
      tokenMaxDecimals: args.collateralTokenPrecision,
    },
  })
    .switchPrecisionMode('tokenMax')
    .integerValue(BigNumber.ROUND_DOWN)
    .toBigNumber()

  const fromToken = {
    symbol: args.collateralTokenSymbol,
    precision: args.collateralTokenPrecision,
    address: position.pool.collateralToken,
  }
  const toToken = {
    symbol: args.quoteTokenSymbol,
    precision: args.quoteTokenPrecision,
    address: position.pool.quoteToken,
  }

  return StrategiesCommon.getSwapDataForCloseToDebt({
    fromToken,
    toToken,
    slippage: args.slippage,
    swapAmountBeforeFees$: swapAmountBeforeFees$,
    getSwapData: dependencies.getSwapData,
  })
}

async function getAjnaSwapDataToCloseToCollateral(
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
) {
  const outstandingDebt$ = new Amount({
    amount: position.debtAmount,
    precision: {
      mode: 'none',
      tokenMaxDecimals: args.quoteTokenPrecision,
    },
  })
    .switchPrecisionMode('tokenMax')
    .integerValue(BigNumber.ROUND_DOWN)
    .toBigNumber()

  const collateralToken = {
    symbol: args.collateralTokenSymbol,
    precision: args.collateralTokenPrecision,
    address: position.pool.collateralToken,
  }
  const debtToken = {
    symbol: args.quoteTokenSymbol,
    precision: args.quoteTokenPrecision,
    address: position.pool.quoteToken,
  }

  const colPrice = args.collateralPrice
  const debtPrice = args.quotePrice

  return StrategiesCommon.getSwapDataForCloseToCollateral({
    collateralToken,
    debtToken,
    colPrice,
    debtPrice,
    slippage: args.slippage,
    outstandingDebt$,
    ETHAddress: dependencies.WETH,
    getSwapData: dependencies.getSwapData,
  })
}

async function buildOperation(
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
  swapData: SwapData,
  preSwapFee$: BigNumber,
  collectFeeFrom: CollectFeeFrom,
): Promise<IOperation> {
  const amountToFlashloan$ = new Amount({
    amount: position.debtAmount.times(ONE.plus(FLASHLOAN_SAFETY_MARGIN)),
    precision: {
      mode: 'none',
      tokenMaxDecimals: args.quoteTokenPrecision,
    },
  })
    .switchPrecisionMode('tokenMax')
    .integerValue(BigNumber.ROUND_DOWN)
    .toBigNumber()

  const lockedCollateralAmount$ = new Amount({
    amount: position.collateralAmount,
    precision: {
      mode: 'none',
      tokenMaxDecimals: args.collateralTokenPrecision,
    },
  })
    .switchPrecisionMode('tokenMax')
    .integerValue(BigNumber.ROUND_DOWN)
    .toBigNumber()

  const collateralToken = {
    symbol: args.collateralTokenSymbol,
    precision: args.collateralTokenPrecision,
    address: position.pool.collateralToken,
  }
  const debtToken = {
    symbol: args.quoteTokenSymbol,
    precision: args.quoteTokenPrecision,
    address: position.pool.quoteToken,
  }

  const fee = SwapUtils.feeResolver(args.collateralTokenSymbol, args.quoteTokenSymbol)
  const collateralAmountToBeSwapped$ = args.shouldCloseToCollateral
    ? swapData.fromTokenAmount.plus(preSwapFee$)
    : lockedCollateralAmount$
  const oraclePrice$$ = new Amount({
    amount: args.collateralPrice.div(args.quotePrice),
    precision: {
      mode: 'none',
      tokenMaxDecimals: TYPICAL_PRECISION,
    },
  })
    .switchPrecisionMode('normalized')
    .toBigNumber()

  const closeArgs = {
    collateral: {
      address: collateralToken.address,
      isEth: areSymbolsEqual(collateralToken.symbol, 'ETH'),
    },
    debt: {
      address: debtToken.address,
      isEth: areSymbolsEqual(debtToken.symbol, 'ETH'),
    },
    swap: {
      fee: fee.toNumber(),
      data: swapData.exchangeCalldata,
      amount: collateralAmountToBeSwapped$,
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    },
    flashloan: {
      // Always balancer on Ajna for now
      provider: FlashloanProvider.Balancer,
      amount: Domain.debtToCollateralSwapFlashloan(amountToFlashloan$),
    },
    position: {
      type: positionType,
      collateral: { amount: collateralAmountToBeSwapped$ },
    },
    proxy: {
      address: args.dpmProxyAddress,
      // Ajna is always DPM
      isDPMProxy: true,
      owner: args.user,
    },
    addresses: {
      ...dependencies.addresses,
      WETH: dependencies.WETH,
      operationExecutor: dependencies.operationExecutor,
      pool: args.poolAddress,
    },
    // Prices must be in 18 decimal precision
    price: oraclePrice$$,
  }

  if (args.shouldCloseToCollateral) {
    return await operations.ajna.closeToCollateral(closeArgs)
  } else {
    return await operations.ajna.closeToQuote(closeArgs)
  }
}
