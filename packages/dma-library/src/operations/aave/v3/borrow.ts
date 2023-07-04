import { getAaveBorrowV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { BorrowArgs } from '@dma-library/operations/aave/common/borrow-args'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3/addresses'
import { ActionCall, IOperation } from '@dma-library/types'

export type BorrowV3Operation = (
  args: BorrowArgs,
  addresses: AAVEV3StrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const borrow: BorrowV3Operation = async (
  { borrowToken, amountInBaseUnit, account, isEthToken },
  addresses,
  network,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.aave.v3.aaveV3Borrow(network, {
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
    operationName: getAaveBorrowV3OperationDefinition(network).name,
  }
}
