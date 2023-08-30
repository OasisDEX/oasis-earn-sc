import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { AAVETokens, IViewPositionDependencies, IViewPositionParams } from '@dma-library/types'
import { AaveVersion } from '@dma-library/types/aave'

export type AaveGetCurrentPositionArgs = IViewPositionParams<AAVETokens>
export type AaveV2GetCurrentPositionDependencies =
  IViewPositionDependencies<AaveLikeStrategyAddresses> & {
    protocolVersion: AaveVersion.v2
  }
export type AaveV3GetCurrentPositionDependencies =
  IViewPositionDependencies<AaveLikeStrategyAddresses> & {
    protocolVersion: AaveVersion.v3
  }

export type AaveGetCurrentPositionDependencies =
  | AaveV2GetCurrentPositionDependencies
  | AaveV3GetCurrentPositionDependencies
