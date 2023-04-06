import BigNumber from 'bignumber.js'

import { AavePositionStrategy, AaveV3PositionStrategy, PositionDetails } from './positionDetails'
import { StrategyDependenciesAaveV2, StrategyDependenciesAaveV3 } from './strategiesDependencies'
import { RuntimeConfig } from '@oasisdex/dma-common/utils/types/common'
import { deploySystem } from '@dma-library/test/utils'
import { AAVETokensToGet } from '@dma-library/test/utils/aave'

export type SystemWithAAVEPositions = {
  config: RuntimeConfig
  // TODO: Update Deploy Class to return correct shape for system
  system: any
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
