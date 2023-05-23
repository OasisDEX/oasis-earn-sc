import { DeployedSystem, System } from '@deploy-configurations/types/deployed-system'
import { deploySystem } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { AAVETokensToGet } from '@dma-contracts/test/utils/aave'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { AavePositionStrategy, AaveV3PositionStrategy, PositionDetails } from './position-details'
import { StrategyDependenciesAaveV2, StrategyDependenciesAaveV3 } from './strategies-dependencies'

export type SystemWithAavePositions = {
  config: RuntimeConfig
  hre: HardhatRuntimeEnvironment
  /** @deprecated Use dsSystem instead */
  system: DeployedSystem
  dsSystem: System
  /** @deprecated Use dsSystem instead */
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dpmPositions: Partial<Record<AavePositionStrategy, PositionDetails>>
  dsProxyPosition: PositionDetails
  strategiesDependencies: StrategyDependenciesAaveV2
  getTokens: {
    byImpersonate: GetTokenFn
    byUniswap: GetTokenFn
  }
}

type GetTokenFn = (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean>

export type SystemWithAAVEV3Positions = Omit<
  SystemWithAavePositions,
  'strategiesDependencies' | 'dpmPositions'
> & {
  strategiesDependencies: StrategyDependenciesAaveV3
  dpmPositions: Partial<Record<AaveV3PositionStrategy, PositionDetails>>
}
