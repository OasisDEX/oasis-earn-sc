import { AAVETokensToGet } from '../../../helpers/aave'
import { RuntimeConfig } from '../../../helpers/types/common'
import { deploySystem } from '../../deploySystem'
import { AavePositionStrategy, AaveV3PositionStrategy, PositionDetails } from './positionDetails'
import { StrategiesDependencies } from './strategiesDependencies'

export type SystemWithAAVEPositions = {
  config: RuntimeConfig
  system: Awaited<ReturnType<typeof deploySystem>>['system']
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dpmPositions: Partial<Record<AavePositionStrategy, PositionDetails>>
  dsProxyPosition: PositionDetails
  strategiesDependencies: StrategiesDependencies
  getTokens: (symbol: AAVETokensToGet, amount: string) => Promise<boolean>
}

export type SystemWithAAVEV3Positions = SystemWithAAVEPositions & {
  dpmPositions: Partial<Record<AaveV3PositionStrategy, PositionDetails>>
}
