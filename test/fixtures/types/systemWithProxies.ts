import BigNumber from 'bignumber.js'

import { AAVETokensToGet } from '../../../helpers/aave/buildGetTokenByImpersonateFunction'
import { RuntimeConfig } from '../../../helpers/types/common'
import { deploySystem } from '../../deploySystem'
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
