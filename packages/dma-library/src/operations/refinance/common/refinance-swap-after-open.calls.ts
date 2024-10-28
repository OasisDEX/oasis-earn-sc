import { FEE_BASE } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import { SwapFeeType } from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithAfterOpenSwap,
  WithNetwork,
  WithNewPosition,
  WithPositionStatus,
  WithStorageIndex,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'

import { RefinancePartialOperationGenerator } from '../types'

export type RefinanceSwapOperationArgs = WithStorageIndex &
  WithPositionStatus &
  WithNewPosition &
  WithAfterOpenSwap &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export const refinanceSwapAfterOpen_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceSwapOperationArgs
  const { network, position, addresses, newPosition, swapAfterOpen } = args

  let { lastStorageIndex } = args

  const swapDebtToFlashloanToken = actions.common.swap(network, {
    fromAsset: newPosition.debt.address,
    toAsset: position.debt.address,
    amount: newPosition.debt.amount,
    receiveAtLeast: swapAfterOpen.receiveAtLeast,
    fee: swapAfterOpen.fee,
    withData: swapAfterOpen.data,
    collectFeeInFromToken: swapAfterOpen.collectFeeFrom === 'sourceToken',
    feeType: swapAfterOpen.feeType ?? SwapFeeType.Percentage,
  })
  lastStorageIndex += 1

  swapDebtToFlashloanToken.skipped = position.debt.address === newPosition.debt.address

  const sendDebtToken = actions.common.sendToken(
    network,
    {
      asset: position.debt.address,
      to: addresses.operationExecutor,
      amount: position.debt.amount.plus(BALANCER_FEE.div(FEE_BASE).times(position.debt.amount)),
    },
    [0, 0, 0],
  )

  return {
    calls: [swapDebtToFlashloanToken, sendDebtToken],
    lastStorageIndex,
  }
}

// Operation definition
export const refinanceSwapAfterOpen_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.SWAP_ACTION',
    optional: true,
  },
  {
    serviceNamePath: 'common.SEND_TOKEN',
    optional: false,
  },
]
