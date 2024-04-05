import { FEE_ESTIMATE_INFLATOR, ONE, TEN, ZERO } from '@dma-common/constants'
import { CollectFeeFrom } from '@dma-common/types'
import { areAddressesEqual } from '@dma-common/utils/addresses'
import { amountToWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { operations } from '@dma-library/operations'
import { resolveTxValue } from '@dma-library/protocols/ajna'
import * as StrategiesCommon from '@dma-library/strategies/common'
import {
  FlashloanProvider,
  IOperation,
  MorphoBluePosition,
  PositionType,
  SummerStrategy,
  SwapData,
} from '@dma-library/types'
import { StrategyError, StrategyWarning } from '@dma-library/types/ajna/ajna-validations'
import { encodeOperation } from '@dma-library/utils/operation'
import * as SwapUtils from '@dma-library/utils/swap'
import * as Domain from '@domain'
import BigNumber from 'bignumber.js'

import { getTokenSymbol, MorphoMultiplyDependencies } from './open'

export interface MorphoCloseMultiplyPayload {
  slippage: BigNumber
  position: MorphoBluePosition
  quoteTokenPrecision: number
  collateralTokenPrecision: number
  user: string
  dpmProxyAddress: string
  shouldCloseToCollateral: boolean
}

export type MorphoCloseStrategy = (
  args: MorphoCloseMultiplyPayload,
  dependencies: MorphoMultiplyDependencies,
) => Promise<SummerStrategy<MorphoBluePosition>>

const positionType: PositionType = 'Multiply'

export const closeMultiply: MorphoCloseStrategy = async (args, dependencies) => {
  const position = args.position

  const getSwapData = args.shouldCloseToCollateral
    ? getMorphoSwapDataToCloseToCollateral
    : getMorphoSwapDataToCloseToDebt
  const collateralTokenSymbol = await getTokenSymbol(
    args.position.marketParams.collateralToken,
    dependencies.provider,
  )
  const debtTokenSymbol = await getTokenSymbol(
    args.position.marketParams.loanToken,
    dependencies.provider,
  )

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
    args,
    dependencies,
    position,
    collateralTokenSymbol,
    debtTokenSymbol,
  )

  // Build operation
  const operation = await buildOperation(
    args,
    dependencies,
    position,
    swapData,
    preSwapFee,
    collectFeeFrom,
    collateralTokenSymbol,
    debtTokenSymbol,
  )

  // Prepare Payload
  const isDepositingEth =
    args.position.marketParams.collateralToken.toLowerCase() ===
    dependencies.addresses.WETH.toLowerCase()

  const targetPosition = args.position.close()

  const fee = SwapUtils.feeResolver(collateralTokenSymbol, debtTokenSymbol, {
    isEarnPosition: SwapUtils.isCorrelatedPosition(collateralTokenSymbol, debtTokenSymbol),
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

  return prepareMorphoDMAPayload({
    swaps: [{ ...swapData, collectFeeFrom, tokenFee }],
    dependencies,
    targetPosition,
    data: encodeOperation(operation, dependencies),
    errors: errors,
    warnings: warnings,
    successes: [],
    notices: [],
    txValue: resolveTxValue(isDepositingEth, ZERO),
  })
}

async function getMorphoSwapDataToCloseToDebt(
  args: MorphoCloseMultiplyPayload,
  dependencies: MorphoMultiplyDependencies,
  position: MorphoBluePosition,
  collateralTokenSymbol: string,
  debtTokenSymbol: string,
) {
  const swapAmountBeforeFees = amountToWei(
    position.collateralAmount,
    args.collateralTokenPrecision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const fromToken = {
    symbol: collateralTokenSymbol,
    precision: args.collateralTokenPrecision,
    address: position.marketParams.collateralToken,
  }
  const toToken = {
    symbol: debtTokenSymbol,
    precision: args.quoteTokenPrecision,
    address: position.marketParams.loanToken,
  }

  return StrategiesCommon.getSwapDataForCloseToDebt({
    fromToken,
    toToken,
    slippage: args.slippage,
    swapAmountBeforeFees: swapAmountBeforeFees,
    getSwapData: dependencies.getSwapData,
  })
}

async function getMorphoSwapDataToCloseToCollateral(
  args: MorphoCloseMultiplyPayload,
  dependencies: MorphoMultiplyDependencies,
  position: MorphoBluePosition,
  collateralTokenSymbol: string,
  debtTokenSymbol: string,
) {
  const outstandingDebt = amountToWei(position.debtAmount, args.quoteTokenPrecision).integerValue(
    BigNumber.ROUND_DOWN,
  )

  const collateralToken = {
    symbol: collateralTokenSymbol,
    precision: args.collateralTokenPrecision,
    address: position.marketParams.collateralToken,
  }
  const debtToken = {
    symbol: debtTokenSymbol,
    precision: args.quoteTokenPrecision,
    address: position.marketParams.loanToken,
  }

  const colPrice = args.position.collateralPrice
  const debtPrice = args.position.debtPrice

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
  args: MorphoCloseMultiplyPayload,
  dependencies: MorphoMultiplyDependencies,
  position: MorphoBluePosition,
  swapData: SwapData,
  preSwapFee: BigNumber,
  collectFeeFrom: CollectFeeFrom,
  collateralTokenSymbol: string,
  debtTokenSymbol: string,
): Promise<IOperation> {
  const DEBT_OFFSET = new BigNumber(1.01)
  const amountToFlashloan = amountToWei(
    position.debtAmount.times(DEBT_OFFSET),
    args.quoteTokenPrecision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const lockedCollateralAmount = amountToWei(
    position.collateralAmount,
    args.collateralTokenPrecision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const collateralToken = {
    symbol: collateralTokenSymbol,
    precision: args.collateralTokenPrecision,
    address: position.marketParams.collateralToken,
  }
  const debtToken = {
    symbol: debtTokenSymbol,
    precision: args.quoteTokenPrecision,
    address: position.marketParams.loanToken,
  }

  const fee = SwapUtils.feeResolver(collateralTokenSymbol, debtTokenSymbol, {
    isEarnPosition: SwapUtils.isCorrelatedPosition(collateralTokenSymbol, debtTokenSymbol),
    isIncreasingRisk: false,
  })

  const collateralAmountToBeSwapped = args.shouldCloseToCollateral
    ? swapData.fromTokenAmount.plus(preSwapFee)
    : lockedCollateralAmount

  const closeArgs = {
    collateral: {
      address: collateralToken.address,
      isEth: areAddressesEqual(collateralToken.address, dependencies.addresses.WETH),
    },
    debt: {
      address: debtToken.address,
      isEth: areAddressesEqual(debtToken.address, dependencies.addresses.WETH),
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
        address: position.marketParams.loanToken,
      },
      provider: FlashloanProvider.Balancer,
      amount: Domain.debtToCollateralSwapFlashloan(amountToFlashloan),
    },
    position: {
      type: positionType,
      collateral: { amount: lockedCollateralAmount },
    },
    proxy: {
      address: args.dpmProxyAddress,
      isDPMProxy: true,
      owner: args.user,
    },
    addresses: {
      morphoblue: dependencies.morphoAddress,
      operationExecutor: dependencies.operationExecutor,
      tokens: dependencies.addresses,
    },
    network: dependencies.network,
    amountDebtToPaybackInBaseUnit: amountToFlashloan,
    amountCollateralToWithdrawInBaseUnit: lockedCollateralAmount,
    morphoBlueMarket: {
      loanToken: args.position.marketParams.loanToken,
      collateralToken: args.position.marketParams.collateralToken,
      oracle: args.position.marketParams.oracle,
      irm: args.position.marketParams.irm,
      lltv: args.position.marketParams.lltv.times(TEN.pow(18)),
    },
  }

  return await operations.morphoblue.multiply.close(closeArgs)
}

export const prepareMorphoDMAPayload = ({
  dependencies,
  targetPosition,
  errors,
  warnings,
  data,
  txValue,
  swaps,
}: {
  dependencies: MorphoMultiplyDependencies
  targetPosition: MorphoBluePosition
  errors: StrategyError[]
  warnings: StrategyWarning[]
  notices: []
  successes: []
  data: string
  txValue: string
  swaps: (SwapData & { collectFeeFrom: 'sourceToken' | 'targetToken'; tokenFee: BigNumber })[]
}): SummerStrategy<MorphoBluePosition> => {
  return {
    simulation: {
      swaps,
      errors,
      warnings,
      notices: [],
      successes: [],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.operationExecutor,
      data,
      value: txValue,
    },
  }
}
