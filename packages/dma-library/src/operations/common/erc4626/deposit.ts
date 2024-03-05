import { getErc4626DepositOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { ActionCall, IOperation, WithProxy, WithSwap } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export type Erc4626DepositArgs = {
  vault: string
  depositToken: string
  pullToken: string
  amountToDeposit: BigNumber
  isEthToken: boolean
} & WithSwap &
  WithProxy

export type Erc4626DepositOperation = (
  args: Erc4626DepositArgs,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const deposit: Erc4626DepositOperation = async (
  { vault, amountToDeposit, depositToken, pullToken, isEthToken, swap, proxy },
  addresses,
  network,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.common.pullToken(network, {
      amount: amountToDeposit,
      asset: pullToken,
      from: proxy.owner,
    }),
    actions.common.wrapEth(network, {
      amount: amountToDeposit,
    }),
    actions.common.swap(network, {
      fromAsset: pullToken,
      toAsset: depositToken,
      amount: swap.amount,
      receiveAtLeast: swap.receiveAtLeast,
      fee: swap.fee,
      withData: swap.data,
      collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
    }),
    actions.common.setApproval(network, {
      amount: new BigNumber(0),
      asset: isEthToken ? addresses.tokens.ETH : depositToken,
      delegate: vault,
      sumAmounts: true,
    }),
    actions.common.erc4626Deposit(network, {
      amount: amountToDeposit,
      vault,
    }),
  ]
  calls[0].skipped = !isEthToken
  calls[1].skipped = !isEthToken
  calls[2].skipped = depositToken == pullToken

  return {
    calls,
    operationName: getErc4626DepositOperationDefinition(network).name,
  }
}
