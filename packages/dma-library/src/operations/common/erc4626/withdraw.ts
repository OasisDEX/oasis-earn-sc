import { ADDRESS_ZERO } from '@deploy-configurations/addresses'
import { getErc4626WithdrawOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { ActionCall, IOperation, WithProxy, WithSwap } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { MAX_UINT, ZERO } from '../../../../../dma-common/constants/numbers'
import { Erc4626StrategyAddresses } from '../../../types/common/erc4626-addresses'

export type Erc4626WithdrawArgs = {
  vault: string
  withdrawToken: string
  returnToken: string
  amountToWithdraw: BigNumber
  isWithdrawingEth: boolean
  isReturningEth: boolean
  isClose: boolean
} & Partial<WithSwap> &
  WithProxy

export type Erc4626WithdrawOperation = (
  args: Erc4626WithdrawArgs,
  addresses: Erc4626StrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const withdraw: Erc4626WithdrawOperation = async (
  {
    isClose,
    vault,
    amountToWithdraw,
    withdrawToken,
    returnToken,
    isWithdrawingEth,
    swap,
    isReturningEth,
  },
  addresses,
  network,
) => {
  // Import ActionCall as it assists type generation

  const calls: ActionCall[] = [
    actions.common.erc4626Withdraw(network, {
      amount: isClose ? new BigNumber(MAX_UINT) : amountToWithdraw,
      vault,
    }),
    actions.common.swap(network, {
      fromAsset: swap ? withdrawToken : ADDRESS_ZERO,
      toAsset: swap ? returnToken : ADDRESS_ZERO,
      amount: swap ? swap.amount : ZERO,
      receiveAtLeast: swap ? swap.receiveAtLeast : ZERO,
      fee: swap ? swap.fee : 0,
      withData: swap ? swap.data : '0x00',
      collectFeeInFromToken: swap ? swap.collectFeeFrom === 'sourceToken' : false,
    }),
    actions.common.unwrapEth(network, {
      amount: new BigNumber(MAX_UINT),
    }),
    actions.common.returnFunds(network, {
      asset: isReturningEth ? addresses.tokens.ETH : returnToken,
    }),
    actions.common.returnFunds(network, {
      asset: isWithdrawingEth ? addresses.tokens.ETH : withdrawToken,
    }),
  ]
  /* 
  we skip unwrapping of WETH if we are not returning ETH or withdrawing ETH
  we unwrap WETH if we are returning ETH (after swap or after withdraw) 
  or withdrawing leftover ETH ( difference between what we withdraw and what we swap)
  we skip the second return funds action if there is no swap - we withdraw and return the same token
  */
  calls[2].skipped = !isReturningEth && !isWithdrawingEth
  calls[1].skipped = !swap
  calls[4].skipped = !swap

  return {
    calls,
    operationName: getErc4626WithdrawOperationDefinition(network).name,
  }
}
