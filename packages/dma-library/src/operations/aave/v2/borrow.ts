import { getAaveBorrowV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { BorrowArgs } from '@dma-library/operations'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { ActionCall, IOperation } from '@dma-library/types'

export type BorrowV2Operation = (
  args: BorrowArgs,
  addresses: AAVEStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const borrow: BorrowV2Operation = async (
  { borrowToken, amountInBaseUnit, account, isEthToken },
  addresses,
  network,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.aave.v2.aaveBorrow(network, {
      amount: amountInBaseUnit,
      asset: borrowToken,
      to: account,
    }),
    actions.common.unwrapEth(network, {
      amount: amountInBaseUnit,
    }),
    actions.common.returnFunds(network, {
      asset: isEthToken ? addresses.ETH : borrowToken,
    }),
  ]

  calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: getAaveBorrowV2OperationDefinition(network).name,
  }
}
