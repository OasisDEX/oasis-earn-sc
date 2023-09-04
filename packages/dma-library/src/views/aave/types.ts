import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { AaveLikeTokens, IViewPositionParams } from '@dma-library/types'
import { AaveVersion } from '@dma-library/types/aave'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveGetCurrentPositionArgs = IViewPositionParams<AaveLikeTokens>
export type AaveV2GetCurrentPositionDependencies =
  StrategyParams.WithViewPositionDependencies<AaveLikeStrategyAddresses> & {
    protocolVersion: AaveVersion.v2
  }
export type AaveV3GetCurrentPositionDependencies =
  StrategyParams.WithViewPositionDependencies<AaveLikeStrategyAddresses> & {
    protocolVersion: AaveVersion.v3
  }
