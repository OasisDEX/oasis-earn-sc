import { OperationNames } from '@deploy-configurations/constants'
import { getMorphoBlueOpenDepositBorrowOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { ActionCall, IOperation, PositionType, Protocol } from '@dma-library/types'

import { MorphoBlueStrategyAddresses } from '../addresses'
import { borrow, MorphoBlueBorrowArgs } from './borrow'
import { deposit, MorphoBlueDepositArgs } from './deposit'

type MorphoBlueOpenDepositBorrowArgs = [
  depositArgs: MorphoBlueDepositArgs,
  borrowArgs: MorphoBlueBorrowArgs,
  metaArgs: { protocol: Protocol; positionType: PositionType },
  addresses: MorphoBlueStrategyAddresses,
  network: Network,
]

export type MorphoBlueOpenDepositBorrowOperation = (
  ...args: MorphoBlueOpenDepositBorrowArgs
) => Promise<IOperation>

export const openDepositBorrow: MorphoBlueOpenDepositBorrowOperation = async (
  depositArgs,
  borrowArgs,
  { protocol, positionType },
  addresses,
  network,
) => {
  const depositCalls = (await deposit(depositArgs, addresses, network)).calls
  const borrowCalls = (await borrow(borrowArgs, addresses, network)).calls

  if (borrowArgs?.amountToBorrow.isZero()) {
    borrowCalls.forEach(call => {
      call.skipped = true
    })
  }

  const positionCreatedEvent = actions.common.positionCreated(network, {
    protocol,
    positionType,
    collateralToken: depositArgs.morphoBlueMarket.collateralToken,
    debtToken: borrowArgs.morphoBlueMarket.loanToken,
  })

  return {
    calls: [...depositCalls, ...borrowCalls, positionCreatedEvent],
    operationName: getMorphoBlueOpenDepositBorrowOperationDefinition(network).name,
  } as {
    // Import ActionCall as it assists type generation
    calls: ActionCall[]
    operationName: OperationNames
  }
}
