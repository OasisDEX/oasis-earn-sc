import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveLikeDepositBorrowArgs = StrategyParams.WithAaveLikeBorrowStrategyArgs &
  StrategyParams.WithAaveEntryToken &
  StrategyParams.WithDepositCollateral &
  StrategyParams.WithBorrowDebt

export type AaveLikeDepositBorrowDependencies = StrategyParams.WithAaveLikeStrategyDependencies &
  StrategyParams.WithOptionalGetSwap

export type IDepositBorrowStrategy = Strategies.IStrategy & {
  simulation: Strategies.IStrategy['simulation'] & Strategies.WithOptionalSwapSimulation
}

export type AaveLikeDepositBorrow = (
  args: AaveLikeDepositBorrowArgs,
  dependencies: AaveLikeDepositBorrowDependencies,
) => Promise<IDepositBorrowStrategy>

export type AaveLikeDepositBorrowArgsOmni = AaveLikeDepositBorrowArgs & {
  position: AaveLikePositionV2
}

export type AaveLikeDepositBorrowDependenciesOmni = AaveLikeDepositBorrowDependencies & {
  operationExecutor: string
}

export type AaveLikeDepositBorrowOmni = (
  args: AaveLikeDepositBorrowArgsOmni,
  dependencies: AaveLikeDepositBorrowDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
