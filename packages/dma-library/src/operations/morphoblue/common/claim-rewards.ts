import { getMorphoBlueClaimRewardsOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { ActionCall, IOperation } from '@dma-library/types'

export type MorphoBlueClaimRewardsArgs = {
  urds: string[]
  rewards: string[]
  claimable: string[]
  proofs: string[][]
}

export type MorphoBlueClaimRewardsOperation = (
  args: MorphoBlueClaimRewardsArgs,
  network: Network,
) => Promise<IOperation>

export const claim: MorphoBlueClaimRewardsOperation = async (
  { urds, rewards, claimable, proofs },
  network,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.morphoblue.claim(network, {
      urd: urds,
      rewards: rewards,
      claimable: claimable,
      proofs: proofs,
    }),
    actions.common.returnMultipleTokens(network, {
      assets: rewards,
    }),
  ]

  return {
    calls,
    operationName: getMorphoBlueClaimRewardsOperationDefinition(network).name,
  }
}
