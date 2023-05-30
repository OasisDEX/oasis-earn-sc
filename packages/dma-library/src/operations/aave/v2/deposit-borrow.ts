import { aaveDepositBorrowV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { BorrowArgs, DepositArgs } from '@dma-library/operations/aave/common'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { ActionCall, IOperation } from '@dma-library/types'

import { borrow } from './borrow'
import { deposit } from './deposit'

type AaveV2DepositBorrowArgs = [
  depositArgs: DepositArgs | undefined,
  borrowArgs: BorrowArgs | undefined,
  addresses: AAVEStrategyAddresses,
]

export type AaveV2DepositBorrowOperation = (...args: AaveV2DepositBorrowArgs) => Promise<IOperation>

export const depositBorrow: AaveV2DepositBorrowOperation = async (
  depositArgs,
  borrowArgs,
  addresses,
) => {
  if (depositArgs && borrowArgs) {
    return {
      calls: [
        ...(await deposit(depositArgs, addresses)).calls,
        ...(await borrow(borrowArgs, addresses)).calls,
      ],
      operationName: aaveDepositBorrowV2OperationDefinition.name,
    } as {
      // Import ActionCall as it assists type generation
      calls: ActionCall[]
      operationName: typeof aaveDepositBorrowV2OperationDefinition.name
    }
  }
  if (depositArgs) {
    return deposit(depositArgs, addresses)
  }
  if (borrowArgs) {
    return borrow(borrowArgs, addresses)
  }

  throw new Error('At least one argument needs to be provided')
}
