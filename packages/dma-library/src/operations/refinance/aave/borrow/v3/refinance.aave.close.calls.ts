import { actions } from '@dma-library/actions'
import { registerRefinanceOperation } from '@dma-library/operations/refinance/refinance.operations'
import {
  RefinancePartialOperationGenerator,
  RefinancePartialOperationType,
} from '@dma-library/operations/refinance/types'
import {
  WithAaveLikeStrategyAddresses,
  WithNetwork,
  WithPaybackAll,
  WithPositionStatus,
  WithProxy,
  WithStorageIndex,
  WithWithdrawAll,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'
import BigNumber from 'bignumber.js'

import { MAX_UINT } from '../../../../../../../dma-common/constants/numbers'

// Arguments type
type RefinanceCloseV3OperationArgs = WithStorageIndex &
  WithProxy &
  WithPositionStatus &
  WithPaybackAll &
  WithWithdrawAll &
  WithAaveLikeStrategyAddresses &
  WithNetwork

// Calls generator
const refinanceClose_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceCloseV3OperationArgs
  const { network, addresses, proxy, position, isPaybackAll } = args

  let lastStorageIndex = args.lastStorageIndex

  const setApproval = actions.common.setApproval(network, {
    amount: position.debt.amount,
    asset: position.debt.address,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  // +1 write to storage
  const paybackDebt = actions.aave.v3.aaveV3Payback(args.network, {
    asset: position.debt.address,
    amount: position.debt.amount,
    paybackAll: isPaybackAll,
  })
  lastStorageIndex += 1

  const withdrawCollateral = actions.aave.v3.aaveV3Withdraw(args.network, {
    asset: position.collateral.address,
    amount: args.isWithdrawAll ? new BigNumber(MAX_UINT) : position.collateral.amount,
    to: proxy.address,
  })

  return {
    calls: [setApproval, paybackDebt, withdrawCollateral],
    lastStorageIndex,
  }
}

// Operation definition
const refinanceClose_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.SET_APPROVAL',
    optional: false,
  },
  {
    serviceNamePath: 'aave.v3.PAYBACK',
    optional: false,
  },
  {
    serviceNamePath: 'aave.v3.WITHDRAW',
    optional: false,
  },
]

registerRefinanceOperation(
  'AAVE_V3',
  RefinancePartialOperationType.Close,
  refinanceClose_calls,
  refinanceClose_definition,
)
