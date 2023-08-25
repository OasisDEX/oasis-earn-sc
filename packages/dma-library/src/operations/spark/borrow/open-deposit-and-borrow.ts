import { OperationNames } from '@deploy-configurations/constants'
import { getSparkOpenDepositBorrowOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import {
  AaveLikeStrategyAddresses,
  BorrowArgs,
  DepositArgs,
} from '@dma-library/operations/aave-like'
import { ActionCall, IOperation, PositionType, Protocol } from '@dma-library/types'

import { borrow } from './borrow'
import { deposit } from './deposit'

type SparkOpenDepositBorrowArgs = [
  depositArgs: DepositArgs,
  borrowArgs: BorrowArgs,
  metaArgs: { protocol: Protocol; positionType: PositionType },
  addresses: AaveLikeStrategyAddresses,
  network: Network,
]

export type SparkOpenDepositBorrowOperation = (
  ...args: SparkOpenDepositBorrowArgs
) => Promise<IOperation>

export const openDepositBorrow: SparkOpenDepositBorrowOperation = async (
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
    operationName: getSparkOpenDepositBorrowOperationDefinition(network).name,
  } as {
    // Import ActionCall as it assists type generation
    calls: ActionCall[]
    operationName: OperationNames
  }
}
