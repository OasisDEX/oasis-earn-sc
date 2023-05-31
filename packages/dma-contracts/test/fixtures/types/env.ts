import { DeployedSystem, System } from '@deploy-configurations/types/deployed-system'
import { deploySystem } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { AAVETokensToGet } from '@dma-contracts/test/utils/aave'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import {
  AavePositionDetails,
  AavePositionStrategy,
  AaveV3PositionStrategy,
  AjnaPositionDetails,
  AjnaPositions,
} from './position-details'
import {
  StrategyDependenciesAaveV2,
  StrategyDependenciesAaveV3,
  StrategyDependenciesAjna,
} from './strategies-dependencies'

type Env = {
  config: RuntimeConfig
  hre: HardhatRuntimeEnvironment
  dsSystem: System
}

export type SystemWithAavePositions = Env & {
  /** @deprecated Use dsSystem instead */
  system: DeployedSystem
  registry: Awaited<ReturnType<typeof deploySystem>>['registry']
  dpmPositions: Partial<Record<AavePositionStrategy, AavePositionDetails>>
  dsProxyPosition: AavePositionDetails
  strategiesDependencies: StrategyDependenciesAaveV2
  getTokens: {
    byImpersonate: GetTokenFn
    byUniswap: GetTokenFn
  }
}

// TODO: Uncouple from AAVE
export type GetTokenFn = (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean>

export type SystemWithAAVEV3Positions = Omit<
  SystemWithAavePositions,
  'strategiesDependencies' | 'dpmPositions'
> & {
  strategiesDependencies: StrategyDependenciesAaveV3
  dpmPositions: Partial<Record<AaveV3PositionStrategy, AavePositionDetails>>
}

export type EnvWithAjnaPositions = Env & {
  positions: Record<AjnaPositions, AjnaPositionDetails>
  dependencies: StrategyDependenciesAjna
  utils: {
    sendLotsOfMoney: GetTokenFn
  }
}
