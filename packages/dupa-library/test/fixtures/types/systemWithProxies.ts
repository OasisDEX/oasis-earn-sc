import BigNumber from 'bignumber.js'

import { deploySystem } from '../../utils/deploy-system'
import { AAVETokensToGet } from '../@oasisdex/dupa-common/utils/aave/buildGetTokenByImpersonateFunction'
import { RuntimeConfig } from '../@oasisdex/dupa-common/utils/types/common'
import { StrategyDependenciesAaveV2 } from './strategiesDependencies'

export type SystemWithProxies = {
  config: RuntimeConfig
  system: Awaited<ReturnType<typeof deploySystem>>['system']
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dsProxy: string
  dpmAccounts: { proxy: string; vaultId: number }[]
  strategiesDependencies: StrategyDependenciesAaveV2
  getTokens: (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean>
}
