import { Protocol } from '@deploy-configurations/types/protocol'
import { actions } from '@dma-library/actions'
import { borrow, borrow_definition } from '@dma-library/operations/aave/borrow/v3/borrow'
import { deposit, deposit_definition } from '@dma-library/operations/aave/borrow/v3/deposit'
import { registerRefinanceOperation } from '@dma-library/operations/refinance/refinance.operations'
import {
  RefinancePartialOperationGenerator,
  RefinancePartialOperationType,
} from '@dma-library/operations/refinance/types'
import {
  WithAaveLikeStrategyAddresses,
  WithNetwork,
  WithNewPosition,
  WithPositionStatus,
  WithProxy,
  WithStorageIndex,
  WithSwap,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'

import { toBorrowArgs, toDepositArgs } from '../../common/refinance.aave.casts'

// Arguments type
type RefinanceAaveV3OpenDepositBorrowOperationArgs = WithStorageIndex &
  WithPositionStatus &
  WithNewPosition &
  WithProxy &
  WithSwap &
  WithAaveLikeStrategyAddresses &
  WithNetwork

// Calls generator
const refinanceOpenDepositBorrow_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceAaveV3OpenDepositBorrowOperationArgs
  const { position, addresses, network } = args

  let lastStorageIndex = args.lastStorageIndex

  const depositArgs = toDepositArgs(args)
  const depositCalls = (await deposit(depositArgs, addresses, network)).calls
  if (depositArgs.isSwapNeeded) {
    // TODO: This is a hack to track the use of the storage. This should be automatically
    // returned by all operations so they can be composed together, but there is no time
    // right now
    lastStorageIndex += 1
  }

  const borrowArgs = toBorrowArgs(args)
  const borrowCalls = (await borrow(borrowArgs, addresses, network)).calls

  if (borrowArgs?.amount.isZero()) {
    borrowCalls.forEach(call => {
      call.skipped = true
    })
  }

  const protocol: Protocol = 'AAVE_V3'

  const positionCreatedEvent = actions.common.positionCreated(network, {
    protocol,
    positionType: position.type,
    collateralToken: depositArgs.depositToken,
    debtToken: borrowArgs.borrowToken,
  })

  return {
    calls: [...depositCalls, ...borrowCalls, positionCreatedEvent],
    lastStorageIndex,
  }
}

// Operation definition
const refinanceOpenDepositBorrow_definition: ActionPathDefinition[] = [
  ...deposit_definition,
  ...borrow_definition,
  {
    serviceNamePath: 'common.POSITION_CREATED',
    optional: false,
  },
]

registerRefinanceOperation(
  'AAVE_V3',
  RefinancePartialOperationType.Open,
  refinanceOpenDepositBorrow_calls,
  refinanceOpenDepositBorrow_definition,
)
