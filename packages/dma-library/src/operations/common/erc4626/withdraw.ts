import { getErc4626WithdrawOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { ActionCall, IOperation, WithProxy, WithSwap } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export type Erc4626WithdrawArgs = {
  vault: string
  withdrawToken: string
  returnToken: string
  amountToWithdraw: BigNumber
  isEthToken: boolean
} & WithSwap &
  WithProxy

export type Erc4626WithdrawOperation = (
  args: Erc4626WithdrawArgs,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const withdraw: Erc4626WithdrawOperation = async (
  { vault, amountToWithdraw, withdrawToken, returnToken, isEthToken, swap, proxy },
  addresses,
  network,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.common.erc4626Withdraw(network, {
      amount: amountToWithdraw,
      vault,
    }),
    actions.common.swap(network, {
      fromAsset: withdrawToken,
      toAsset: returnToken,
      amount: swap.amount,
      receiveAtLeast: swap.receiveAtLeast,
      fee: swap.fee,
      withData: swap.data,
      collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
    }),
    actions.common.unwrapEth(network, {
      amount: 0,
    }),
    actions.common.returnFunds(network, { asset: returnToken }),
  ]
  calls[2].skipped = !isEthToken && withdrawToken != addresses.tokens.ETH
  calls[1].skipped = withdrawToken == returnToken

  return {
    calls,
    operationName: getErc4626WithdrawOperationDefinition(network).name,
  }
}
