import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveLikeDepositBorrowArgs = StrategyParams.WithAaveLikeBorrowStrategyArgs &
  StrategyParams.WithAaveEntryToken &
  StrategyParams.WithDepositCollateral &
  StrategyParams.WithBorrowDebt

export type AaveLikeDepositBorrowDependencies = StrategyParams.WithAaveLikeStrategyDependencies &
  StrategyParams.WithOptionalSwap

export type IDepositBorrowStrategy = Strategies.IStrategy & {
  simulation: Strategies.IStrategy['simulation'] & Strategies.WithOptionalSwapSimulation
}

export type AaveLikeDepositBorrow = (
  args: AaveLikeDepositBorrowArgs,
  dependencies: AaveLikeDepositBorrowDependencies,
) => Promise<IDepositBorrowStrategy>
