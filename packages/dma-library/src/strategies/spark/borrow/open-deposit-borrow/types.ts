import { IDepositBorrowStrategy } from '@dma-library/strategies/aave/borrow/deposit-borrow/types'
import {
  SparkDepositBorrowArgs,
  SparkDepositBorrowDependencies,
} from '@dma-library/strategies/spark/borrow/deposit-borrow/types'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type SparkOpenDepositBorrowArgs = SparkDepositBorrowArgs

type IOpenDepositBorrowStrategy = IDepositBorrowStrategy

export type SparkOpenDepositBorrowDependencies = SparkDepositBorrowDependencies &
  StrategyParams.WithPositionType
export type SparkOpenDepositBorrow = (
  args: SparkOpenDepositBorrowArgs,
  dependencies: SparkOpenDepositBorrowDependencies,
) => Promise<IOpenDepositBorrowStrategy>
