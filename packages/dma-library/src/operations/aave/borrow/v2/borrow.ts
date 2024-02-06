import { getAaveBorrowV2OperationDefinition } from '@oasisdex/deploy-configurations/operation-definitions'
import { Network } from '@oasisdex/deploy-configurations/types'

import { actions } from '../../../../actions'
import { ActionCall, IOperation } from '../../../../types'
import { AaveLikeStrategyAddresses, BorrowArgs } from '../../../aave-like'

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
