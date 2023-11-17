import { Protocol } from '@deploy-configurations/types/protocol'
import { actions } from '@dma-library/actions'
import { registerRefinanceOperation } from '@dma-library/operations/refinance/refinance.operations'
import {
  RefinancePartialOperationGenerator,
  RefinancePartialOperationType,
} from '@dma-library/operations/refinance/types'
import { ActionCall } from '@dma-library/types'
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

// Arguments type
type RefinanceAaveV3OpenDepositBorrowOperationArgs = WithStorageIndex &
  WithPositionStatus &
  WithNewPosition &
  WithProxy &
  WithSwap &
  WithAaveLikeStrategyAddresses &
  WithNetwork

// Helper functions
function _getRefinanceDepositCalls(
  args: RefinanceAaveV3OpenDepositBorrowOperationArgs,
): ActionCall[] {
  const { newPosition, addresses, network } = args

  const setApproval = actions.common.setApproval(
    network,
    {
      asset: newPosition.collateral.address,
      delegate: addresses.lendingPool,
      amount: newPosition.collateral.amount,
      sumAmounts: false,
    },
    [0, 0, 0, 0],
  )

  const deposit = actions.aave.v3.aaveV3Deposit(
    network,
    {
      asset: newPosition.collateral.address,
      amount: newPosition.collateral.amount,
      sumAmounts: false,
      setAsCollateral: true,
    },
    [0, 0, 0, 0],
  )

  return [setApproval, deposit]
}

// Calls generator
const refinanceOpenDepositBorrow_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceAaveV3OpenDepositBorrowOperationArgs
  const { position, newPosition, proxy, network, lastStorageIndex } = args

  const depositCalls = _getRefinanceDepositCalls(args)

  const borrow = actions.aave.v3.aaveV3Borrow(network, {
    amount: newPosition.debt.amount,
    asset: newPosition.debt.address,
    to: proxy.address,
  })

  const protocol: Protocol = 'AAVE_V3'

  const positionCreatedEvent = actions.common.positionCreated(network, {
    protocol,
    positionType: position.type,
    collateralToken: position.collateral.address,
    debtToken: newPosition.debt.address,
  })

  return {
    calls: [...depositCalls, borrow, positionCreatedEvent],
    lastStorageIndex,
  }
}

// Operation definition
const refinanceOpenDepositBorrow_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.SET_APPROVAL',
    optional: false,
  },
  {
    serviceNamePath: 'aave.v3.DEPOSIT',
    optional: false,
  },
  {
    serviceNamePath: 'aave.v3.BORROW',
    optional: false,
  },
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
