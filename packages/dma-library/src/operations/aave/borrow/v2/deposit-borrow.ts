import { OperationNames } from '@oasisdex/deploy-configurations/constants'
import { getAaveDepositBorrowV2OperationDefinition } from '@oasisdex/deploy-configurations/operation-definitions'
import { Network } from '@oasisdex/deploy-configurations/types'

import { ActionCall, IOperation } from '../../../../types'
import { AaveLikeStrategyAddresses, BorrowArgs, DepositArgs } from '../../../aave-like'
import { borrow } from './borrow'
import { deposit } from './deposit'

type AaveV2DepositBorrowArgs = [
  depositArgs: DepositArgs | undefined,
  borrowArgs: BorrowArgs | undefined,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
]

export type AaveV2DepositBorrowOperation = (...args: AaveV2DepositBorrowArgs) => Promise<IOperation>

export const depositBorrow: AaveV2DepositBorrowOperation = async (
  depositArgs,
  borrowArgs,
  addresses,
  network,
) => {
  if (depositArgs && borrowArgs) {
    return {
      calls: [
        ...(await deposit(depositArgs, addresses, network)).calls,
        ...(await borrow(borrowArgs, addresses, network)).calls,
      ],
      operationName: getAaveDepositBorrowV2OperationDefinition(network).name,
    } as {
      // Import ActionCall as it assists type generation
      calls: ActionCall[]
      operationName: OperationNames
    }
  }
  if (depositArgs) {
    return deposit(depositArgs, addresses, network)
  }
  if (borrowArgs) {
    return borrow(borrowArgs, addresses, network)
  }

  throw new Error('At least one argument needs to be provided')
}
