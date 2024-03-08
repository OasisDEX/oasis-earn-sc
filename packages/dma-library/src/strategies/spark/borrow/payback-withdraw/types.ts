import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { IStrategy } from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkPaybackWithdrawArgs = StrategyParams.WithAaveLikeBorrowStrategyArgs &
  StrategyParams.WithWithdrawCollateral &
  StrategyParams.WithPaybackDebt

type IPaybackWithdrawStrategy = IStrategy

export type SparkPaybackWithdrawDependencies = Omit<
  StrategyParams.WithAaveLikeStrategyDependencies,
  'protocolType'
>

export type SparkPaybackWithdraw = (
  args: SparkPaybackWithdrawArgs,
  dependencies: SparkPaybackWithdrawDependencies,
) => Promise<IPaybackWithdrawStrategy>

export type SparkPaybackWithdrawArgsOmni = SparkPaybackWithdrawArgs &
  StrategyParams.WithAaveLikePositionV2

export type SparkPaybackWithdrawDependenciesOmni = SparkPaybackWithdrawDependencies &
  StrategyParams.WithAaveLikeWithOperationExecutor

export type SparkPaybackWithdrawOmni = (
  args: SparkPaybackWithdrawArgsOmni,
  dependencies: SparkPaybackWithdrawDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
