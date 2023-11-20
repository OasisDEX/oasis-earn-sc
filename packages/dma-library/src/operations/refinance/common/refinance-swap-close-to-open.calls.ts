import { actions } from '@dma-library/actions'
import {
  WithCloseToOpenSwap,
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
  WithCloseToOpenSwap &
  WithNetwork

export const refinanceSwapCloseToOpen_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceSwapOperationArgs
  const { network, position, newPosition, swapCloseToOpen } = args

  let { lastStorageIndex } = args

  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
    fromAsset: position.collateral.address,
    toAsset: newPosition.collateral.address,
    amount: position.collateral.amount,
    receiveAtLeast: swapCloseToOpen.receiveAtLeast,
    fee: swapCloseToOpen.fee,
    withData: swapCloseToOpen.data,
    collectFeeInFromToken: swapCloseToOpen.collectFeeFrom === 'sourceToken',
  })
  lastStorageIndex += 1

  swapDebtTokensForCollateralTokens.skipped =
    position.collateral.address === newPosition.collateral.address

  return {
    calls: [swapDebtTokensForCollateralTokens],
    lastStorageIndex,
  }
}

// Operation definition
export const refinanceSwapCloseToOpen_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.SWAP_ACTION',
    optional: true,
  },
]
