import {
  AaveLikeAdjustArgs,
  IAdjustStrategy,
} from '@dma-library/strategies/aave-like/multiply/adjust/types'
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
