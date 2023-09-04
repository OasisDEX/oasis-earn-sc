import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkDepositBorrowArgs = StrategyParams.WithAaveLikeBorrowStrategyArgs &
  StrategyParams.WithAaveLikeEntryToken &
  StrategyParams.WithDepositCollateral &
  StrategyParams.WithBorrowDebt

export type SparkDepositBorrowDependencies = Omit<
  StrategyParams.WithAaveLikeStrategyDependencies,
  'protocolType'
> &
  StrategyParams.WithOptionalGetSwap

export type IDepositBorrowStrategy = Strategies.IStrategy & {
  simulation: Strategies.IStrategy['simulation'] & Strategies.WithOptionalSwapSimulation
}

export type SparkDepositBorrow = (
  args: SparkDepositBorrowArgs,
  dependencies: SparkDepositBorrowDependencies,
) => Promise<IDepositBorrowStrategy>
