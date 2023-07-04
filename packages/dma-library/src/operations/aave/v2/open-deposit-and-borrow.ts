import { Network } from '@deploy-configurations/types/network'
import { OPERATION_NAMES } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BorrowArgs, DepositArgs } from '@dma-library/operations/aave/common'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { ActionCall, IOperation, PositionType, Protocol } from '@dma-library/types'

import { borrow } from './borrow'
import { deposit } from './deposit'

type AaveV2OpenDepositBorrowArgs = [
  depositArgs: DepositArgs,
  borrowArgs: BorrowArgs,
  metaArgs: { protocol: Protocol; positionType: PositionType },
  addresses: AAVEStrategyAddresses,
  network: Network,
]

export type AaveV2OpenDepositBorrowOperation = (
  ...args: AaveV2OpenDepositBorrowArgs
) => Promise<IOperation>

export const openDepositAndBorrow: AaveV2OpenDepositBorrowOperation = async (
  depositArgs,
  borrowArgs,
  { protocol, positionType },
  addresses,
  network,
) => {
  const positionCreatedEvent = actions.common.positionCreated(network, {
    protocol,
    positionType,
    collateralToken: depositArgs.depositToken,
    debtToken: borrowArgs.borrowToken,
  })

  const depositCalls = (await deposit(depositArgs, addresses, network)).calls
  const borrowCalls = (await borrow(borrowArgs, addresses, network)).calls

  if (borrowArgs.amountInBaseUnit.isZero()) {
    borrowCalls.forEach(call => {
      call.skipped = true
    })
  }

  return {
    calls: [...depositCalls, ...borrowCalls, positionCreatedEvent],
    operationName: OPERATION_NAMES.aave.v2.OPEN_DEPOSIT_BORROW,
  } as {
    // Import ActionCall as it assists type generation
    calls: ActionCall[]
    operationName: typeof OPERATION_NAMES.aave.v2.OPEN_DEPOSIT_BORROW
  }
}
