import { Address, Tx } from '@dma-common/types'
import { Network } from '@dma-library/index'
import { operations } from '@dma-library/operations'
import { CommonDMADependencies } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'
import BigNumber from 'bignumber.js'

import { ZERO } from '../../../../../dma-common/constants/numbers'

export interface MorphoClaimRewardsDependencies extends CommonDMADependencies {
  network: Network
}

export interface MorphoCloseClaimRewardsPayload {
  urds: Address[]
  rewards: Address[]
  claimable: BigNumber[]
  proofs: string[][]
}

export type MorphoClaimRewardsStrategy = (
  args: MorphoCloseClaimRewardsPayload,
  dependencies: MorphoClaimRewardsDependencies,
) => Promise<Tx>

export const claimRewards: MorphoClaimRewardsStrategy = async (args, dependencies) => {
  const operation = await operations.morphoblue.common.claimRewards(
    {
      urds: args.urds,
      rewards: args.rewards,
      claimable: args.claimable.map(item => item.toString()),
      proofs: args.proofs,
    },
    dependencies.network,
  )

  return {
    to: dependencies.operationExecutor,
    data: encodeOperation(operation, dependencies),
    value: ZERO.toString(),
  }
}
