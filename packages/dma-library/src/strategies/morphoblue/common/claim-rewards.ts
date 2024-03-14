import { Address, Tx } from '@dma-common/types'
import { operations } from '@dma-library/operations'
import { encodeOperation } from '@dma-library/utils/operation'
import BigNumber from 'bignumber.js'

import { ZERO } from '../../../../../dma-common/constants/numbers'
import { MorphoMultiplyDependencies } from './open'

export interface MorphoCloseClaimRewardsPayload {
  urds: Address[]
  rewards: Address[]
  claimable: BigNumber[]
  proofs: string[][]
  user: string
  dpmProxyAddress: string
  shouldCloseToCollateral: boolean
}

export type MorphoClaimRewardsStrategy = (
  args: MorphoCloseClaimRewardsPayload,
  dependencies: MorphoMultiplyDependencies,
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
