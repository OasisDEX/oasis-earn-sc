import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { IViewPositionParams } from '@dma-library/types'
import { AaveLikeTokens } from '@dma-library/types/aave/tokens'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkGetCurrentPositionArgs = IViewPositionParams<AaveLikeTokens>
export type SparkGetCurrentPositionDependencies =
  StrategyParams.WithViewPositionDependencies<AaveLikeStrategyAddresses>
