import {
  AaveLikeOpenArgs,
  AaveLikeOpenArgsOmni,
} from '@dma-library/strategies/aave-like/multiply/open'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkOpenDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'currentPosition' | 'protocolType'
> &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type IOpenStrategy = Strategies.IMultiplyStrategy
export type SparkOpen = (
  args: AaveLikeOpenArgs,
  dependencies: SparkOpenDependencies,
) => Promise<IOpenStrategy>

export type SparkOpenDependenciesOmni = SparkOpenDependencies &
  StrategyParams.WithAaveLikeWithOperationExecutor &
  StrategyParams.WithProvider

export type SparkOpenOmni = (
  args: AaveLikeOpenArgsOmni,
  dependencies: SparkOpenDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
