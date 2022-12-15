import { ActionCall } from '../../actions/types/actionCall'
import { OPERATION_NAMES } from '../../helpers/constants'
import { borrow, BorrowArgs } from './borrow'
import { deposit, DepositArgs } from './deposit'

export async function depositBorrow(
  depositArgs: DepositArgs | undefined,
  borrowArgs: BorrowArgs | undefined,
) {
  const operationCalls: ActionCall[] = [
    ...(depositArgs ? (await deposit(depositArgs)).calls : []),
    ...(borrowArgs ? (await borrow(borrowArgs)).calls : []),
  ]

  if (operationCalls.length === 0) {
    throw new Error('No calls')
  }

  return {
    calls: operationCalls,
    operationName: OPERATION_NAMES.aave.DEPOSIT_BORROW,
  }
}
