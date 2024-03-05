import { getMorphoBlueClaimRewardsOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { ActionCall, IOperation, MorphoBlueMarket } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { MorphoBlueStrategyAddresses } from '../addresses'

export type MorphoBlueClaimRewardsArgs = {
  morphoBlueMarket: MorphoBlueMarket
  amountToClaimRewards: BigNumber
  isEthToken: boolean
}

export type MorphoBlueClaimRewardsOperation = (
  args: MorphoBlueClaimRewardsArgs,
  addresses: MorphoBlueStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const borrow: MorphoBlueClaimRewardsOperation = async (
  { morphoBlueMarket, amountToClaimRewards, isEthToken },
  addresses,
  network,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.morphoblue.borrow(network, {
      morphoBlueMarket: morphoBlueMarket,
      amount: amountToClaimRewards,
    }),
    actions.common.unwrapEth(network, {
      amount: amountToClaimRewards,
    }),
    actions.common.returnFunds(network, {
      asset: isEthToken ? addresses.tokens.ETH : morphoBlueMarket.loanToken,
    }),
  ]

  calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: getMorphoBlueClaimRewardsOperationDefinition(network).name,
  }
}
