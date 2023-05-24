import { aaveDepositBorrowV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { DepositArgs } from '@dma-library/operations/aave/common'
import { BorrowArgs } from '@dma-library/operations/aave/common/borrow-args'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3/addresses'
import { ActionCall, IOperation } from '@dma-library/types'

import { borrow } from './borrow'
import { deposit } from './deposit'

type AaveV3DepositBorrowArgs = [
  depositArgs: DepositArgs | undefined,
  borrowArgs: BorrowArgs | undefined,
  addresses: AAVEV3StrategyAddresses,
]

export type AaveV3DepositBorrowOperation = (...args: AaveV3DepositBorrowArgs) => Promise<IOperation>

export const depositBorrow: AaveV3DepositBorrowOperation = async (
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
      operationName: aaveDepositBorrowV3OperationDefinition.name,
    } as {
      // Import ActionCall as it assists type generation
      calls: ActionCall[]
      operationName: typeof aaveDepositBorrowV3OperationDefinition.name
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
