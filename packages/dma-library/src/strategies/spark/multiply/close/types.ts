import { AaveLikeCloseArgs } from '@dma-library/strategies/aave-like/multiply/close'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkCloseDependencies = StrategyParams.WithAaveLikeMultiplyStrategyDependencies &
  StrategyParams.WithSwap &
  StrategyParams.WithPositionType

export type SparkCloseArgs = AaveLikeCloseArgs & StrategyParams.WithCloseToCollateralFlag

export type ICloseStrategy = Strategies.IMultiplyStrategy
export type SparkClose = (
  args: SparkCloseArgs,
  dependencies: SparkCloseDependencies,
) => Promise<ICloseStrategy>
