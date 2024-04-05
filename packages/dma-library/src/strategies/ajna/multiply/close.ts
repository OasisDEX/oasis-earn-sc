import { FEE_ESTIMATE_INFLATOR, ONE, ZERO } from '@dma-common/constants'
import { CollectFeeFrom } from '@dma-common/types'
import { amountToWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { areSymbolsEqual } from '@dma-common/utils/symbols'
import { operations } from '@dma-library/operations'
import { prepareAjnaDMAPayload, resolveTxValue } from '@dma-library/protocols/ajna'
import { ajnaBuckets } from '@dma-library/strategies'
import * as StrategiesCommon from '@dma-library/strategies/common'
import {
  AjnaPosition,
  FlashloanProvider,
  IOperation,
  PositionType,
  SummerStrategy,
  SwapData,
} from '@dma-library/types'
import {
  AjnaCloseMultiplyPayload,
  AjnaCommonDMADependencies,
} from '@dma-library/types/ajna/ajna-dependencies'
import { encodeOperation } from '@dma-library/utils/operation'
import * as SwapUtils from '@dma-library/utils/swap'
import * as Domain from '@domain'
import { FLASHLOAN_SAFETY_MARGIN } from '@domain/constants'
import BigNumber from 'bignumber.js'

export type AjnaCloseStrategy = (
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
) => Promise<SummerStrategy<AjnaPosition>>

const positionType: PositionType = 'Multiply'

export const closeMultiply: AjnaCloseStrategy = async (args, dependencies) => {
  const position = args.position
  // Get Swap Data
  const getSwapData = args.shouldCloseToCollateral
    ? getAjnaSwapDataToCloseToCollateral
    : getAjnaSwapDataToCloseToDebt

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(args, dependencies, position)

  // Build operation
  const operation = await buildOperation(
    args,
    dependencies,
    position,
    swapData,
    preSwapFee,
    collectFeeFrom,
  )

  // Prepare Payload
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const targetPosition = args.position.close()

  const fee = SwapUtils.feeResolver(args.collateralTokenSymbol, args.quoteTokenSymbol, {
    isEarnPosition: SwapUtils.isCorrelatedPosition(
      args.collateralTokenSymbol,
      args.quoteTokenSymbol,
    ),
    isIncreasingRisk: false,
  })

  const postSwapFee =
    collectFeeFrom === 'targetToken' ? calculateFee(swapData.toTokenAmount, fee.toNumber()) : ZERO

  const tokenFee = preSwapFee.plus(
    postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
  )

  // Validation
  const errors = [
    // Add as required...
  ]

  const warnings = [
    // Add as required..
  ]

  return prepareAjnaDMAPayload({
    swaps: [{ ...swapData, collectFeeFrom, tokenFee }],
    dependencies,
    targetPosition,
    data: encodeOperation(operation, dependencies),
    errors: errors,
    warnings: warnings,
    successes: [],
    notices: [],
    // TODO instead of zero we will need data from swap
    txValue: resolveTxValue(isDepositingEth, ZERO),
  })
}

async function getAjnaSwapDataToCloseToDebt(
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
) {
  const swapAmountBeforeFees = amountToWei(
    position.collateralAmount,
    args.collateralTokenPrecision,
  ).integerValue(BigNumber.ROUND_DOWN)

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
    swapAmountBeforeFees: swapAmountBeforeFees,
    getSwapData: dependencies.getSwapData,
  })
}

async function getAjnaSwapDataToCloseToCollateral(
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
) {
  const outstandingDebt = amountToWei(position.debtAmount, args.quoteTokenPrecision).integerValue(
    BigNumber.ROUND_DOWN,
  )

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
    outstandingDebt,
    getSwapData: dependencies.getSwapData,
  })
}

async function buildOperation(
  args: AjnaCloseMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
  swapData: SwapData,
  preSwapFee: BigNumber,
  collectFeeFrom: CollectFeeFrom,
): Promise<IOperation> {
  const amountToFlashloan = amountToWei(
    position.debtAmount.times(ONE.plus(FLASHLOAN_SAFETY_MARGIN)),
    args.quoteTokenPrecision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const lockedCollateralAmount = amountToWei(
    position.collateralAmount,
    args.collateralTokenPrecision,
  ).integerValue(BigNumber.ROUND_DOWN)

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

  const fee = SwapUtils.feeResolver(args.collateralTokenSymbol, args.quoteTokenSymbol, {
    isEarnPosition: SwapUtils.isCorrelatedPosition(
      args.collateralTokenSymbol,
      args.quoteTokenSymbol,
    ),
    isIncreasingRisk: false,
  })

  const collateralAmountToBeSwapped = args.shouldCloseToCollateral
    ? swapData.fromTokenAmount.plus(preSwapFee)
    : lockedCollateralAmount

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
      amount: collateralAmountToBeSwapped,
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    },
    flashloan: {
      token: {
        amount: Domain.debtToCollateralSwapFlashloan(amountToFlashloan),
        address: position.pool.quoteToken,
      },
      // Always balancer on Ajna for now
      provider: FlashloanProvider.Balancer,
      amount: Domain.debtToCollateralSwapFlashloan(amountToFlashloan),
    },
    position: {
      type: positionType,
      collateral: { amount: collateralAmountToBeSwapped },
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
    price: new BigNumber(ajnaBuckets[ajnaBuckets.length - 1]),
    network: dependencies.network,
  }

  if (args.shouldCloseToCollateral) {
    return await operations.ajna.closeToCollateral(closeArgs)
  } else {
    return await operations.ajna.closeToQuote(closeArgs)
  }
}
