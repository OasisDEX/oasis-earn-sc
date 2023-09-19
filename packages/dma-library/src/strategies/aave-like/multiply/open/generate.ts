import { FEE_ESTIMATE_INFLATOR, ONE, ZERO } from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import { IOperation, SwapData } from '@dma-library/types'
import { IBaseSimulatedTransition } from '@domain'
import BigNumber from 'bignumber.js'

import { AaveLikeOpenArgs, AaveLikeOpenDependencies, IOpenStrategy } from './types'

type GenerateTransitionArgs = {
  swapData: SwapData
  operation: IOperation
  collectFeeFrom: 'sourceToken' | 'targetToken'
  fee: BigNumber
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
  const shouldCollectFeeFromSourceToken = collectFeeFrom === 'sourceToken'

  const preSwapFee = shouldCollectFeeFromSourceToken
    ? calculateFee(simulatedPositionTransition.delta.debt, fee.toNumber())
    : ZERO
  const postSwapFee = shouldCollectFeeFromSourceToken
    ? ZERO
    : calculateFee(swapData.toTokenAmount, fee.toNumber())

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
        tokenFee: preSwapFee.plus(
          postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
        ),
      },
      position: finalPosition,
    },
    flashloan: {
      ...simulatedPositionTransition.flashloan,
    },
  }
}
