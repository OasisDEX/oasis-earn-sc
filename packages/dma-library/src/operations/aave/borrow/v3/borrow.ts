import { getAaveBorrowV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { AaveLikeStrategyAddresses, BorrowArgs } from '@dma-library/operations/aave-like'
import { ActionCall, IOperation } from '@dma-library/types'

export type AaveV3BorrowOperation = (
  args: BorrowArgs,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const borrow: AaveV3BorrowOperation = async (
  { borrowToken, amount, account, isEthToken },
  addresses,
  network,
) => {

  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.aave.v3.aaveV3Borrow(network, {
      amount,
      asset: borrowToken,
      to: account,
    }),
    // actions.common.unwrapEth(network, {
    //   amount,
    // }),
    actions.common.returnFunds(network, {
      asset: isEthToken ? addresses.tokens.ETH : borrowToken,
    }),
  ]

  // calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: getAaveBorrowV3OperationDefinition(network).name,
  }
}
