import { OPERATION_NAMES } from '@dma-common/constants'
import { ActionCall, IOperation } from '@dma-library/types'

import { borrow, BorrowArgs } from './borrow'
import { deposit, DepositArgs } from './deposit'

type AaveV2DepositBorrowArgs = [
  depositArgs: DepositArgs | undefined,
  borrowArgs: BorrowArgs | undefined,
]

export type AaveV2DepositBorrowOperation = (...args: AaveV2DepositBorrowArgs) => Promise<IOperation>

export const depositBorrow: AaveV2DepositBorrowOperation = async (depositArgs, borrowArgs) => {
  if (depositArgs && borrowArgs) {
    return {
      calls: [...(await deposit(depositArgs)).calls, ...(await borrow(borrowArgs)).calls],
      operationName: OPERATION_NAMES.aave.v2.DEPOSIT_BORROW,
    } as {
      // Import ActionCall as it assists type generation
      calls: ActionCall[]
      operationName: typeof OPERATION_NAMES.aave.v2.DEPOSIT_BORROW
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
