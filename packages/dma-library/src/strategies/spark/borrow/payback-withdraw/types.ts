import { IStrategy } from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkPaybackWithdrawArgs = StrategyParams.WithAaveLikeBorrowStrategyArgs &
  StrategyParams.WithWithdrawCollateral &
  StrategyParams.WithPaybackDebt

type IPaybackWithdrawStrategy = IStrategy

export type SparkPaybackWithdrawDependencies = StrategyParams.WithAaveLikeStrategyDependencies

export type SparkPaybackWithdraw = (
  args: SparkPaybackWithdrawArgs,
  dependencies: SparkPaybackWithdrawDependencies,
) => Promise<IPaybackWithdrawStrategy>
