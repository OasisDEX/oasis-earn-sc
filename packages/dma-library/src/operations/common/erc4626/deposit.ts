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
  isOpen: boolean
  isSwapping: boolean
} & WithSwap &
  WithProxy

export type Erc4626DepositOperation = (
  args: Erc4626DepositArgs,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const deposit: Erc4626DepositOperation = async (
  { vault, amountToDeposit, depositToken, pullToken, isEthToken, swap, proxy, isOpen, isSwapping },
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
    actions.common.setApproval(
      network,
      {
        amount: isSwapping ? new BigNumber(0) : amountToDeposit,
        asset: isEthToken ? addresses.tokens.ETH : depositToken,
        delegate: vault,
        sumAmounts: false,
      },
      [0, 0, isSwapping ? 1 : 0, 0],
    ),
    actions.common.erc4626Deposit(
      network,
      {
        vault,
        amount: amountToDeposit,
      },
      [0, isSwapping ? 1 : 0],
    ),

    actions.common.positionCreated(network, {
      protocol: vault,
      positionType: 'Earn',
      collateralToken: depositToken,
      debtToken: depositToken,
    }),
  ]

  calls[0].skipped = isEthToken
  calls[1].skipped = !isEthToken
  calls[2].skipped = !isSwapping
  calls[5].skipped = !isOpen

  return {
    calls,
    operationName: getErc4626DepositOperationDefinition(network).name,
  }
}
