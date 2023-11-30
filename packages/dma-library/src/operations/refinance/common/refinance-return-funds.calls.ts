import { actions } from '@dma-library/actions'
import {
  WithAaveLikeStrategyAddresses,
  WithNetwork,
  WithPositionStatus,
  WithStorageIndex,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'

import { RefinancePartialOperationGenerator } from '../types'
import BigNumber from 'bignumber.js'
import { MAX_UINT } from '@dma-common/constants'

export type RefinanceReturnFundsOperationArgs = WithStorageIndex &
  WithPositionStatus &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export const refinanceReturnFunds_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceReturnFundsOperationArgs
  const { network, position, lastStorageIndex } = args

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })
  unwrapEth.skipped = !position.debt.isEth

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: position.debt.address,
  })

  return {
    calls: [unwrapEth, returnDebtFunds],
    lastStorageIndex,
  }
}

// Operation definition
export const refinanceReturnFunds_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.UNWRAP_ETH',
    optional: true,
  },
  {
    serviceNamePath: 'common.RETURN_FUNDS',
    optional: false,
  },
]
