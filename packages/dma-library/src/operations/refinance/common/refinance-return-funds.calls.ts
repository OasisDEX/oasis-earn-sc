import { actions } from '@dma-library/actions'
import {
  WithAaveLikeStrategyAddresses,
  WithNetwork,
  WithPositionStatus,
  WithStorageIndex,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'

import { RefinancePartialOperationGenerator } from '../types'

export type RefinanceReturnFundsOperationArgs = WithStorageIndex &
  WithPositionStatus &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export const refinanceReturnFunds_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceReturnFundsOperationArgs
  const { network, position, lastStorageIndex } = args

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: position.debt.address,
  })

  return {
    calls: [returnDebtFunds],
    lastStorageIndex,
  }
}

// Operation definition
export const refinanceReturnFunds_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.RETURN_FUNDS',
    optional: false,
  },
]
