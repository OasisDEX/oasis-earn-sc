import { actions } from '@dma-library/actions'
import {
  WithAaveLikeStrategyAddresses,
  WithAfterOpenSwap,
  WithNetwork,
  WithNewPosition,
  WithPositionStatus,
  WithStorageIndex,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'
import BigNumber from 'bignumber.js'

import { MAX_UINT } from '../../../../../dma-common/constants/numbers'
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
  })
  lastStorageIndex += 1

  swapDebtToFlashloanToken.skipped = position.debt.address === newPosition.debt.address

  const sendDebtToken = actions.common.sendToken(
    network,
    {
      asset: position.debt.address,
      to: addresses.operationExecutor,
      amount: new BigNumber(MAX_UINT),
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
