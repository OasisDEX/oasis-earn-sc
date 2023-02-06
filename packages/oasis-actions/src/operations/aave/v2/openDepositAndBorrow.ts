import * as actions from '../../../actions'
import { OPERATION_NAMES } from '../../../helpers/constants'
import { PositionType, Protocol } from '../../../types'
import { borrow, BorrowArgs } from './borrow'
import { deposit, DepositArgs } from './deposit'

export async function openDepositAndBorrow(
  depositArgs: DepositArgs,
  borrowArgs: BorrowArgs,
  { protocol, positionType }: { protocol: Protocol; positionType: PositionType },
) {
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
    operationName: OPERATION_NAMES.aave.OPEN_DEPOSIT_BORROW,
  }
}
