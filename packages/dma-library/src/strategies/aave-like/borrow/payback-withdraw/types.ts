import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { IStrategy } from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveLikePaybackWithdrawArgs = StrategyParams.WithAaveLikeBorrowStrategyArgs &
  StrategyParams.WithWithdrawCollateral &
  StrategyParams.WithPaybackDebt

type IPaybackWithdrawStrategy = IStrategy

export type AaveLikePaybackWithdrawDependencies = StrategyParams.WithAaveLikeStrategyDependencies

export type AaveLikePaybackWithdraw = (
  args: AaveLikePaybackWithdrawArgs,
  dependencies: AaveLikePaybackWithdrawDependencies,
) => Promise<IPaybackWithdrawStrategy>

export type AaveLikePaybackWithdrawArgsOmni = AaveLikePaybackWithdrawArgs & {
  position: AaveLikePositionV2
}

export type AaveLikePaybackWithdrawDependenciesOmni = AaveLikePaybackWithdrawDependencies & {
  operationExecutor: string
}

export type AaveLikePaybackWithdrawOmni = (
  args: AaveLikePaybackWithdrawArgsOmni,
  dependencies: AaveLikePaybackWithdrawDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
