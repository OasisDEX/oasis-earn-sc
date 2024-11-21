import { IOperation, SwapData } from '@dma-library/types'
import {
  calculateInflatedTokenFee,
  calculatePostSwapFeeAmount,
  calculatePreSwapFeeAmount,
} from '@dma-library/utils/swap'
import type { ResolvedFee } from '@dma-library/utils/swap/fee-resolver'
import { IBaseSimulatedTransition } from '@domain'

import { AaveLikeOpenArgs, AaveLikeOpenDependencies, IOpenStrategy } from './types'

type GenerateTransitionArgs = {
  swapData: SwapData
  operation: IOperation
  collectFeeFrom: 'sourceToken' | 'targetToken'
  fee: ResolvedFee
  simulatedPositionTransition: IBaseSimulatedTransition
  args: AaveLikeOpenArgs
  dependencies: AaveLikeOpenDependencies
  quoteSwapData: SwapData
}

export async function generate({
  swapData,
  operation,
  collectFeeFrom,
  fee,
  simulatedPositionTransition,
}: GenerateTransitionArgs): Promise<IOpenStrategy> {
  const finalPosition = simulatedPositionTransition.position

  // When collecting fees from the target token (collateral here), we want to calculate the fee
  // Based on the toTokenAmount NOT minToTokenAmount so that we over estimate the fee where possible
  // And do not mislead the user

  const preSwapFee = calculatePreSwapFeeAmount(
    collectFeeFrom,
    simulatedPositionTransition.delta.debt,
    fee.feeToCharge,
    fee.feeType,
  )

  const postSwapFee = calculatePostSwapFeeAmount(
    collectFeeFrom,
    swapData.toTokenAmount,
    fee.feeToCharge,
    fee.feeType,
  )

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: simulatedPositionTransition.delta,
      swap: {
        ...simulatedPositionTransition.swap,
        ...swapData,
        collectFeeFrom,
        tokenFee: calculateInflatedTokenFee({ postSwapFee, preSwapFee }),
      },
      position: finalPosition,
    },
    flashloan: {
      ...simulatedPositionTransition.flashloan,
    },
  }
}
