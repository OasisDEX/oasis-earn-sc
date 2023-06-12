import { ZERO } from '@dma-common/constants'
import { prepareAjnaDMAPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { getSwapDataToCloseToDebt } from '@dma-library/strategies/common'
import { getSwapDataToCloseToCollateral } from '@dma-library/strategies/common/close-to-coll-swap-data'
import {
  AjnaOpenMultiplyPayload,
  AjnaPosition,
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
  const operation = await buildOperation(args, dependencies, position, swapData)

  // Prepare Payload
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const targetPosition = args.position.close()

  return prepareAjnaDMAPayload({
    swaps: [],
    dependencies,
    targetPosition,
    data: encodeOperation(operation, dependencies),
    errors: [],
    warnings: [],
    success: [],
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
  const swapAmountBeforeFees$ = position.collateralAmount
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

  return getSwapDataToCloseToDebt({
    fromToken,
    toToken,
    slippage: args.slippage,
    swapAmountBeforeFees$,
    getSwapData: dependencies.getSwapData,
  })
}

async function getAjnaSwapDataToCloseToCollateral(
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
) {
  const outstandingDebt$ = position.debtAmount
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

  return getSwapDataToCloseToCollateral({
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
  args: AjnaOpenMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
  swapData: SwapData,
): IOperation {}
