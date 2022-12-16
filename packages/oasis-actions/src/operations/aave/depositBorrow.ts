import { OPERATION_NAMES } from '../../helpers/constants'
import { borrow, BorrowArgs } from './borrow'
import { deposit, DepositArgs } from './deposit'

export async function depositBorrow(
  depositArgs: DepositArgs | undefined,
  borrowArgs: BorrowArgs | undefined,
) {
  if (depositArgs && borrowArgs) {
    return {
      calls: [...(await deposit(depositArgs)).calls, ...(await borrow(borrowArgs)).calls],
      operationName: OPERATION_NAMES.aave.DEPOSIT_BORROW,
    }
  }
  if (depositArgs) {
    return deposit(depositArgs)
  }
  if (borrowArgs) {
    return borrow(borrowArgs)
  }

  throw new Error('At least one argument needs to be provided')
}
