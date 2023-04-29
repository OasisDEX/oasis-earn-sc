import { deploySystem } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { AAVETokensToGet } from '@dma-contracts/test/utils/aave'
import BigNumber from 'bignumber.js'

import { StrategyDependenciesAaveV2 } from './strategies-dependencies'

export type SystemWithProxies = {
  config: RuntimeConfig
  system: Awaited<ReturnType<typeof deploySystem>>['system']
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dsProxy: string
  dpmAccounts: { proxy: string; vaultId: number }[]
  strategiesDependencies: StrategyDependenciesAaveV2
  getTokens: (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean>
}
