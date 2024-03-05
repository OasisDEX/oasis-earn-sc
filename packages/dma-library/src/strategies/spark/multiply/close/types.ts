import { AaveLikeCloseArgs } from '@dma-library/strategies/aave-like/multiply/close'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkCloseDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'protocolType'
> &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type SparkCloseArgs = AaveLikeCloseArgs & StrategyParams.WithCloseToCollateralFlag

export type ICloseStrategy = Strategies.IMultiplyStrategy
export type SparkClose = (
  args: SparkCloseArgs,
  dependencies: SparkCloseDependencies,
) => Promise<ICloseStrategy>

export type SparkCloseArgsOmni = SparkCloseArgs & StrategyParams.WithAaveLikePositionV2

export type SparkCloseDependenciesOmni = SparkCloseDependencies &
  StrategyParams.WithAaveLikeWithOperationExecutor &
  StrategyParams.WithProvider

export type SparkCloseOmni = (
  args: SparkCloseArgsOmni,
  dependencies: SparkCloseDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
