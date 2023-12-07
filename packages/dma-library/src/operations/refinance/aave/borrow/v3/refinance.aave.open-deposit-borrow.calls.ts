import { Protocol } from '@deploy-configurations/types/protocol'
import { actions } from '@dma-library/actions'
import { registerRefinanceOperation } from '@dma-library/operations/refinance/refinance.operations'
import {
  RefinancePartialOperationGenerator,
  RefinancePartialOperationType,
} from '@dma-library/operations/refinance/types'
import {
  WithAaveLikeStrategyAddresses,
  WithNetwork,
  WithNewPosition,
  WithProxy,
  WithStorageIndex,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'

// Arguments type
type RefinanceAaveV3OpenDepositBorrowOperationArgs = WithStorageIndex &
  WithNewPosition &
  WithProxy &
  WithAaveLikeStrategyAddresses &
  WithNetwork

// Calls generator
const refinanceOpenDepositBorrow_calls: RefinancePartialOperationGenerator = async _args => {
  const args = _args as RefinanceAaveV3OpenDepositBorrowOperationArgs
  const { newPosition, addresses, proxy, network } = args

  let lastStorageIndex = args.lastStorageIndex

  const setApproval = actions.common.setApproval(
    network,
    {
      asset: newPosition.collateral.address,
      delegate: addresses.lendingPool,
      amount: newPosition.collateral.amount,
      sumAmounts: false,
    },
    [0, 0, lastStorageIndex - 1, 0],
  )

  const deposit = actions.aave.v3.aaveV3Deposit(
    network,
    {
      asset: newPosition.collateral.address,
      amount: newPosition.collateral.amount,
      sumAmounts: false,
      setAsCollateral: true,
    },
    [0, lastStorageIndex - 1, 0, 0],
  )
  lastStorageIndex += 1

  const borrow = actions.aave.v3.aaveV3Borrow(network, {
    amount: newPosition.debt.amount,
    asset: newPosition.debt.address,
    to: proxy.address,
  })

  const protocol: Protocol = 'AAVE_V3'

  const positionCreatedEvent = actions.common.positionCreated(network, {
    protocol,
    positionType: newPosition.type,
    collateralToken: newPosition.collateral.address,
    debtToken: newPosition.debt.address,
  })

  return {
    calls: [setApproval, deposit, borrow, positionCreatedEvent],
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
