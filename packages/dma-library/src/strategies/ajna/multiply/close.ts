import { TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { CollectFeeFrom } from '@dma-common/types'
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
import { Amount } from '@domain'
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

  return StrategiesCommon.getSwapDataForCloseToDebt({
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
  const amountToFlashloan$ = position.debtAmount
  const lockedCollateralAmount$ = position.collateralAmount

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
  const oraclePrice = args.collateralPrice.div(args.quotePrice)

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
      amount: amountToFlashloan$,
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
    price: new Amount({
      amount: oraclePrice,
      precision: {
        mode: 'none',
        tokenMaxDecimals: TYPICAL_PRECISION,
      },
    })
      .switchPrecisionMode('tokenMax')
      .toBigNumber(),
  }

  if (args.shouldCloseToCollateral) {
    return await operations.ajna.closeToCollateral(closeArgs)
  } else {
    return await operations.ajna.closeToQuote(closeArgs)
  }
}
