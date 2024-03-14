import { ADDRESS_ZERO } from '@deploy-configurations/constants'
import { getErc4626DepositOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { ActionCall, IOperation, WithProxy, WithSwap } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { ZERO } from '../../../../../dma-common/constants/numbers'

export type Erc4626DepositArgs = {
  vault: string
  depositToken: string
  pullToken: string
  amountToDeposit: BigNumber
  isPullingEth: boolean
  isOpen: boolean
} & Partial<WithSwap> &
  WithProxy

export type Erc4626DepositOperation = (
  args: Erc4626DepositArgs,
  network: Network,
) => Promise<IOperation>

export const deposit: Erc4626DepositOperation = async (
  { vault, amountToDeposit, depositToken, pullToken, isPullingEth, swap, proxy, isOpen },
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
      fromAsset: swap ? pullToken : ADDRESS_ZERO,
      toAsset: swap ? depositToken : ADDRESS_ZERO,
      amount: swap ? swap.amount : ZERO,
      receiveAtLeast: swap ? swap.receiveAtLeast : ZERO,
      fee: swap ? swap.fee : 0,
      withData: swap ? swap.data : '0x00',
      collectFeeInFromToken: swap ? swap.collectFeeFrom === 'sourceToken' : false,
    }),
    actions.common.setApproval(
      network,
      {
        amount: swap ? new BigNumber(0) : amountToDeposit,
        asset: depositToken,
        delegate: vault,
        sumAmounts: false,
      },
      [0, 0, swap ? 1 : 0, 0],
    ),
    actions.common.erc4626Deposit(
      network,
      {
        vault,
        amount: amountToDeposit,
      },
      [0, swap ? 1 : 0],
    ),
    actions.common.positionCreated(network, {
      protocol: `erc4626-${vault.toLowerCase()}`,
      positionType: 'Earn',
      collateralToken: depositToken,
      debtToken: depositToken,
    }),
  ]

  calls[0].skipped = isPullingEth
  calls[1].skipped = !isPullingEth
  calls[2].skipped = !swap
  calls[5].skipped = !isOpen

  return {
    calls,
    operationName: getErc4626DepositOperationDefinition(network).name,
  }
}
