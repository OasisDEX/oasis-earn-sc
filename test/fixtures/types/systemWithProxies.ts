import { AAVETokensToGet } from '../../../helpers/aave'
import { RuntimeConfig } from '../../../helpers/types/common'
import { deploySystem } from '../../deploySystem'
import { StrategiesDependencies } from './strategiesDependencies'

export type SystemWithProxies = {
  config: RuntimeConfig
  system: Awaited<ReturnType<typeof deploySystem>>['system']
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dsProxy: string
  dpmAccounts: { proxy: string; vaultId: number }[]
  strategiesDependencies: StrategiesDependencies
  getTokens: (symbol: AAVETokensToGet, amount: string) => Promise<boolean>
}
