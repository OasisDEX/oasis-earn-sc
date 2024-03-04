import { IDepositBorrowStrategy } from '@dma-library/strategies/aave/borrow/deposit-borrow/types'
import {
  SparkDepositBorrowArgs,
  SparkDepositBorrowDependencies,
} from '@dma-library/strategies/spark/borrow/deposit-borrow/types'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkOpenDepositBorrowArgs = SparkDepositBorrowArgs

type IOpenDepositBorrowStrategy = IDepositBorrowStrategy

export type SparkOpenDepositBorrowDependencies = Omit<
  SparkDepositBorrowDependencies,
  'currentPosition' | 'protocolType'
> &
  StrategyParams.WithPositionType
export type SparkOpenDepositBorrow = (
  args: SparkOpenDepositBorrowArgs,
  dependencies: SparkOpenDepositBorrowDependencies,
) => Promise<IOpenDepositBorrowStrategy>

export type SparkOpenDepositBorrowArgsOmni = SparkOpenDepositBorrowArgs &
  StrategyParams.WithAaveLikePositionV2

export type SparkOpenDepositBorrowDependenciesOmni = SparkOpenDepositBorrowDependencies &
  StrategyParams.WithAaveLikeWithOperationExecutor

export type SparkOpenDepositBorrowOmni = (
  args: SparkOpenDepositBorrowArgsOmni,
  dependencies: SparkOpenDepositBorrowDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
