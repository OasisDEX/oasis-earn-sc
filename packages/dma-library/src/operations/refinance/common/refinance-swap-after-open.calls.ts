import { actions } from '@dma-library/actions'
import {
  WithAaveLikeStrategyAddresses,
  WithNetwork,
  WithNewPosition,
  WithPositionStatus,
  WithStorageIndex,
  WithSwapParameters,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'
import BigNumber from 'bignumber.js'

import { MAX_UINT } from '../../../../../dma-common/constants/numbers'
import { RefinancePartialOperationGenerator } from '../types'

export type RefinanceSwapOperationArgs = WithStorageIndex &
  WithPositionStatus &
  WithNewPosition &
  WithSwapParameters &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export const refinanceSwapAfterOpen_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceSwapOperationArgs
  const { network, position, addresses, newPosition, swap } = args

  let { lastStorageIndex } = args

  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
    fromAsset: newPosition.debt.address,
    toAsset: position.debt.address,
    amount: newPosition.debt.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })
  lastStorageIndex += 1

  swapDebtTokensForCollateralTokens.skipped = position.debt.address === newPosition.debt.address

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
    calls: [swapDebtTokensForCollateralTokens, sendDebtToken],
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
    optional: true,
  },
]
