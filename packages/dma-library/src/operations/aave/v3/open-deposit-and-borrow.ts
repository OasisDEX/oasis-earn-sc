import { OperationNames } from '@deploy-configurations/constants'
import { getAaveOpenDepositBorrowV3OperationDefinition } from '@deploy-configurations/operation-definitions/aave/v3/open-deposit-borrow'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { DepositArgs } from '@dma-library/operations/aave/common'
import { BorrowArgs } from '@dma-library/operations/aave/common/borrow-args'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3/addresses'
import { ActionCall, IOperation, PositionType, Protocol } from '@dma-library/types'

import { borrow } from './borrow'
import { deposit } from './deposit'

type AaveV3OpenDepositBorrowArgs = [
  depositArgs: DepositArgs,
  borrowArgs: BorrowArgs,
  metaArgs: { protocol: Protocol; positionType: PositionType },
  addresses: AAVEV3StrategyAddresses,
  network: Network,
]

export type AaveV3OpenDepositBorrowOperation = (
  ...args: AaveV3OpenDepositBorrowArgs
) => Promise<IOperation>

export const openDepositBorrow: AaveV3OpenDepositBorrowOperation = async (
  depositArgs,
  borrowArgs,
  { protocol, positionType },
  addresses,
  network,
) => {
  const depositCalls = (await deposit(depositArgs, addresses, network)).calls
  const borrowCalls = (await borrow(borrowArgs, addresses, network)).calls

  if (borrowArgs.amountInBaseUnit.isZero()) {
    borrowCalls.forEach(call => {
      call.skipped = true
    })
  }

  const positionCreatedEvent = actions.common.positionCreated(network, {
    protocol,
    positionType,
    collateralToken: depositArgs.depositToken,
    debtToken: borrowArgs.borrowToken,
  })

  return {
    calls: [...depositCalls, ...borrowCalls, positionCreatedEvent],
    operationName: getAaveOpenDepositBorrowV3OperationDefinition(network).name,
  } as {
    // Import ActionCall as it assists type generation
    calls: ActionCall[]
    operationName: OperationNames
  }
}
