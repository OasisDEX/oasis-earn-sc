import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { IViewPositionDependencies, IViewPositionParams } from '@dma-library/types'
import { AaveLikeTokens } from '@dma-library/types/aave/tokens'

export type SparkGetCurrentPositionArgs = IViewPositionParams<AaveLikeTokens>
export type SparkGetCurrentPositionDependencies =
  IViewPositionDependencies<AaveLikeStrategyAddresses>
