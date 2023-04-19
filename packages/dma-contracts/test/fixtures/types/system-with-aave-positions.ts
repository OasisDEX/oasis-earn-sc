import { AAVETokensToGet } from '@dma-contracts/test/utils/aave'
import { deploySystem } from '@oasisdex/dma-common/test-utils'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import BigNumber from 'bignumber.js'

import { AavePositionStrategy, AaveV3PositionStrategy, PositionDetails } from './position-details'
import { StrategyDependenciesAaveV2, StrategyDependenciesAaveV3 } from './strategies-dependencies'

export type SystemWithAavePositions = {
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
  SystemWithAavePositions,
  'strategiesDependencies' | 'dpmPositions'
> & {
  strategiesDependencies: StrategyDependenciesAaveV3
  dpmPositions: Partial<Record<AaveV3PositionStrategy, PositionDetails>>
}
