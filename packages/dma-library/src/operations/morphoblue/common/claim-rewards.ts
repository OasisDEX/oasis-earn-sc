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

export const morphoBlueClaimRewards: MorphoBlueClaimRewardsOperation = async (
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
      assets: rewards.filter(
        // for now we need to filter our MORPHO token as it is not transferable and it will stay on dpm proxy
        // until they will update transferability
        item => item.toLowerCase() !== '0x9994e35db50125e0df82e4c2dde62496ce330999',
      ),
    }),
  ]

  return {
    calls,
    operationName: getMorphoBlueClaimRewardsOperationDefinition(network).name,
  }
}
