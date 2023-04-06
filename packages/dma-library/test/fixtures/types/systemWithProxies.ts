import BigNumber from 'bignumber.js'
import { StrategyDependenciesAaveV2 } from './strategiesDependencies'
import { RuntimeConfig } from '@oasisdex/dma-common/utils/types/common'
import { deploySystem } from '@dma-library/test/utils'
import { AAVETokensToGet } from '@dma-library/test/utils/aave'

export type SystemWithProxies = {
  config: RuntimeConfig
  system: Awaited<ReturnType<typeof deploySystem>>['system']
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dsProxy: string
  dpmAccounts: { proxy: string; vaultId: number }[]
  strategiesDependencies: StrategyDependenciesAaveV2
  getTokens: (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean>
}
