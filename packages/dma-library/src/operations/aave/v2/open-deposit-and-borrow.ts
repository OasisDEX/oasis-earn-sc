import { OPERATION_NAMES } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { ActionCall, IOperation, PositionType, Protocol } from '@dma-library/types'

import { borrow, BorrowArgs } from './borrow'
import { deposit, DepositArgs } from './deposit'

type AaveV2OpenDepositBorrowArgs = [
  depositArgs: DepositArgs,
  borrowArgs: BorrowArgs,
  metaArgs: { protocol: Protocol; positionType: PositionType },
]

export type AaveV2OpenDepositBorrowOperation = (
  ...args: AaveV2OpenDepositBorrowArgs
) => Promise<IOperation>

export const openDepositAndBorrow: AaveV2OpenDepositBorrowOperation = async (
  depositArgs,
  borrowArgs,
  { protocol, positionType },
) => {
  const positionCreatedEvent = actions.common.positionCreated({
    protocol,
    positionType,
    collateralToken: depositArgs.depositToken,
    debtToken: borrowArgs.borrowToken,
  })

  const depositCalls = (await deposit(depositArgs)).calls
  const borrowCalls = (await borrow(borrowArgs)).calls

  if (borrowArgs.amountInBaseUnit.isZero()) {
    borrowCalls.forEach(call => {
      call.skipped = true
    })
  }

  return {
    calls: [...depositCalls, ...borrowCalls, positionCreatedEvent],
    operationName: OPERATION_NAMES.aave.v2.OPEN_DEPOSIT_BORROW,
  } as {
    // Import ActionCall as it assists type generation
    calls: ActionCall[]
    operationName: typeof OPERATION_NAMES.aave.v2.OPEN_DEPOSIT_BORROW
  }
}
