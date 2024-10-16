import {
  AaveLikeAdjustArgs,
  AaveLikeAdjustArgsOmni,
  IAdjustStrategy,
} from '@dma-library/strategies/aave-like/multiply/adjust/types'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkAdjustDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'protocolType'
> &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType &
  Partial<StrategyParams.WithDebug>

export type SparkAdjust = (
  args: AaveLikeAdjustArgs,
  dependencies: SparkAdjustDependencies,
) => Promise<IAdjustStrategy>

export type SparkAdjustDependenciesOmni = SparkAdjustDependencies &
  StrategyParams.WithAaveLikeWithOperationExecutor &
  StrategyParams.WithProvider

export type SparkAdjustOmni = (
  args: AaveLikeAdjustArgsOmni,
  dependencies: SparkAdjustDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
