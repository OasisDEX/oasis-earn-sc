import { aaveBorrowV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { actions } from '@dma-library/actions'
import { BorrowArgs } from '@dma-library/operations/aave/common/borrow-args'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { ActionCall, IOperation } from '@dma-library/types'

export type BorrowV2Operation = (
  args: BorrowArgs,
  addresses: AAVEStrategyAddresses,
) => Promise<IOperation>

export const borrow: BorrowV2Operation = async (
  { borrowToken, amountInBaseUnit, account, isEthToken },
  addresses,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.aave.v2.aaveBorrow({
      amount: amountInBaseUnit,
      asset: borrowToken,
      to: account,
    }),
    actions.common.unwrapEth({
      amount: amountInBaseUnit,
    }),
    actions.common.returnFunds({
      asset: isEthToken ? addresses.ETH : borrowToken,
    }),
  ]

  calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: aaveBorrowV2OperationDefinition.name,
  }
}
