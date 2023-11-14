import { actions } from '@dma-library/actions'
import {
  WithNetwork,
  WithNewPosition,
  WithPositionStatus,
  WithStorageIndex,
  WithSwapParameters,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'

import { RefinancePartialOperationGenerator } from '../types'

export type RefinanceSwapOperationArgs = WithStorageIndex &
  WithPositionStatus &
  WithNewPosition &
  WithSwapParameters &
  WithNetwork

export const refinanceSwap_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceSwapOperationArgs
  const { network, position, newPosition, swap } = args

  let { lastStorageIndex } = args

  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
    fromAsset: position.collateral.address,
    toAsset: newPosition.collateral.address,
    amount: position.collateral.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
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
export const refinanceSwap_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.SWAP_ACTION',
    optional: true,
  },
]
