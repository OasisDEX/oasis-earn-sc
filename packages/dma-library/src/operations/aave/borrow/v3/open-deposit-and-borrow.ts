import { OperationNames } from '@oasisdex/deploy-configurations/constants'
import { getAaveOpenDepositBorrowV3OperationDefinition } from '@oasisdex/deploy-configurations/operation-definitions'
import { Network } from '@oasisdex/deploy-configurations/types'

import { actions } from '../../../../actions'
import { ActionCall, IOperation, PositionType, Protocol } from '../../../../types'
import { AaveLikeStrategyAddresses, BorrowArgs, DepositArgs } from '../../../aave-like'
import { borrow } from './borrow'
import { deposit } from './deposit'

type AaveV3OpenDepositBorrowArgs = [
  depositArgs: DepositArgs,
  borrowArgs: BorrowArgs,
  metaArgs: { protocol: Protocol; positionType: PositionType },
  addresses: AaveLikeStrategyAddresses,
  network: Network,
]

export type AaveV3OpenDepositBorrowOperation = (
  ...args: AaveV3OpenDepositBorrowArgs
) => Promise<IOperation>

export const openDepositBorrow: AaveV3OpenDepositBorrowOperation = async (
  depositArgs,
  borrowArgs,
  { protocol, positionType },
  addresses,
  network,
) => {
  const depositCalls = (await deposit(depositArgs, addresses, network)).calls
  const borrowCalls = (await borrow(borrowArgs, addresses, network)).calls

  if (borrowArgs?.amount.isZero()) {
    borrowCalls.forEach(call => {
      call.skipped = true
    })
  }

  const positionCreatedEvent = actions.common.positionCreated(network, {
    protocol,
    positionType,
    collateralToken: depositArgs.depositToken,
    debtToken: borrowArgs.borrowToken,
  })

  return {
    calls: [...depositCalls, ...borrowCalls, positionCreatedEvent],
    operationName: getAaveOpenDepositBorrowV3OperationDefinition(network).name,
  } as {
    // Import ActionCall as it assists type generation
    calls: ActionCall[]
    operationName: OperationNames
  }
}
