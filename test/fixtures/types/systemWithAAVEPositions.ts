import BigNumber from 'bignumber.js'

import { AAVETokensToGet } from '../../../helpers/aave'
import { RuntimeConfig } from '../../../helpers/types/common'
import { DeployedSystem20, DeployedSystem20Return } from '../../../scripts/common/deploy-system'
import { deploySystem } from '../../deploySystem'
import { AavePositionStrategy, AaveV3PositionStrategy, PositionDetails } from './positionDetails'
import { StrategyDependenciesAaveV2, StrategyDependenciesAaveV3 } from './strategiesDependencies'

export type SystemWithAAVEPositions = {
  config: RuntimeConfig
  /** @deprecated Use dsSystem instead */
  system: DeployedSystem20Return
  dsSystem: DeployedSystem20
  /** @deprecated Use dsSystem instead */
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dpmPositions: Partial<Record<AavePositionStrategy, PositionDetails>>
  dsProxyPosition: PositionDetails
  strategiesDependencies: StrategyDependenciesAaveV2
  getTokens: (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean>
}

export type SystemWithAAVEV3Positions = Omit<
  SystemWithAAVEPositions,
  'strategiesDependencies' | 'dpmPositions'
> & {
  strategiesDependencies: StrategyDependenciesAaveV3
  dpmPositions: Partial<Record<AaveV3PositionStrategy, PositionDetails>>
}
