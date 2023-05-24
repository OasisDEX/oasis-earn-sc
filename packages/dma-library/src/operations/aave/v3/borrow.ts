import { aaveBorrowV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { actions } from '@dma-library/actions'
import { BorrowArgs } from '@dma-library/operations/aave/common/borrow-args'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3/addresses'
import { ActionCall, IOperation } from '@dma-library/types'

export type BorrowV3Operation = (
  args: BorrowArgs,
  addresses: AAVEV3StrategyAddresses,
) => Promise<IOperation>

export const borrow: BorrowV3Operation = async (
  { borrowToken, amountInBaseUnit, account, isEthToken },
  addresses,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.aave.v3.aaveV3Borrow({
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
    operationName: aaveBorrowV3OperationDefinition.name,
  }
}
