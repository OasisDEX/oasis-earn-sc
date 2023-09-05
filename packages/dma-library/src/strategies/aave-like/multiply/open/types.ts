import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveLikeOpenArgs = StrategyParams.WithAaveLikeMultiplyStrategyArgs &
  StrategyParams.WithDeposit &
  StrategyParams.WithMultiple

export type AaveLikeOpenDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'currentPosition'
> &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type IOpenStrategy = Strategies.IMultiplyStrategy

export type AaveLikeOpen = (
  args: AaveLikeOpenArgs,
  dependencies: AaveLikeOpenDependencies,
) => Promise<IOpenStrategy>
