import { AAVETokensToGet } from '../../../helpers/aave'
import { HardhatRuntimeConfig } from '../../../helpers/types/common'
import { deploySystem } from '../../deploySystem'
import { AavePositionStrategy, PositionDetails } from './positionDetails'
import { StrategiesDependencies } from './strategiesDependencies'

export type SystemWithAAVEPosition = {
  config: HardhatRuntimeConfig
  system: Awaited<ReturnType<typeof deploySystem>>['system']
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dpmPositions: Partial<Record<AavePositionStrategy, PositionDetails>>
  dsProxyPosition: PositionDetails
  strategiesDependencies: StrategiesDependencies
  getTokens: (symbol: AAVETokensToGet, amount: string) => Promise<boolean>
}
