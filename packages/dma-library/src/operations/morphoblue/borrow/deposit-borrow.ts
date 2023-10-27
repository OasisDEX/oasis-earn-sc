import { OperationNames } from '@deploy-configurations/constants'
import { getMorphoBlueDepositBorrowOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { ActionCall, IOperation } from '@dma-library/types'

import { borrow, MorphoBlueBorrowArgs } from './borrow'
import { deposit, MorphoBlueDepositArgs } from './deposit'

export type MorphoBlueDepositBorrowArgs = [
  depositArgs: MorphoBlueDepositArgs | undefined,
  borrowArgs: MorphoBlueBorrowArgs | undefined,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
]

export type MorphoBlueDepositBorrowOperation = (
  ...args: MorphoBlueDepositBorrowArgs
) => Promise<IOperation>

export const depositBorrow: MorphoBlueDepositBorrowOperation = async (
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
      operationName: getMorphoBlueDepositBorrowOperationDefinition(network).name,
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
