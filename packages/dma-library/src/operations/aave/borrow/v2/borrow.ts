import { getAaveBorrowV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { BorrowArgs } from '@dma-library/operations'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { ActionCall, IOperation } from '@dma-library/types'

export type AaveV2BorrowOperation = (
  args: BorrowArgs,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const borrow: AaveV2BorrowOperation = async (
  { borrowToken, amount, account, isEthToken },
  addresses,
  network,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.aave.v2.aaveBorrow(network, {
      amount: amount,
      asset: borrowToken,
      to: account,
    }),
    actions.common.unwrapEth(network, {
      amount: amount,
    }),
    actions.common.returnFunds(network, {
      asset: isEthToken ? addresses.tokens.ETH : borrowToken,
    }),
  ]

  calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: getAaveBorrowV2OperationDefinition(network).name,
  }
}
