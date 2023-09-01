import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveLikeOpenArgs = StrategyParams.WithAaveLikeMultiplyStrategyArgs &
  StrategyParams.WithDeposit &
  StrategyParams.WithMultiple

export type AaveLikeOpenDependencies = Omit<
  StrategyParams.WithAaveLikeStrategyDependencies,
  'currentPosition'
> &
  StrategyParams.WithSwap

export type IOpenStrategy = Strategies.IStrategy & {
  simulation: Strategies.IStrategy['simulation'] & Strategies.WithOptionalSwapSimulation
}

export type AaveLikeOpen = (
  args: AaveLikeOpenArgs,
  dependencies: AaveLikeOpenDependencies,
) => Promise<IOpenStrategy>
