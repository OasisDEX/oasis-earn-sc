import { AaveLikeOpenArgs } from '@dma-library/strategies/aave-like/multiply/open'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkOpenDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'currentPosition'
> &
  StrategyParams.WithSwap &
  StrategyParams.WithPositionType

export type IOpenStrategy = Strategies.IMultiplyStrategy
export type SparkOpen = (
  args: AaveLikeOpenArgs,
  dependencies: SparkOpenDependencies,
) => Promise<IOpenStrategy>
