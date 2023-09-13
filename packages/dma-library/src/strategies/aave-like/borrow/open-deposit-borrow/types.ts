import { IDepositBorrowStrategy } from '@dma-library/strategies/aave/borrow/deposit-borrow/types'
import {
  AaveLikeDepositBorrowArgs,
  AaveLikeDepositBorrowDependencies,
} from '@dma-library/strategies/aave-like/borrow/deposit-borrow'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveLikeOpenDepositBorrowArgs = AaveLikeDepositBorrowArgs

type IOpenDepositBorrowStrategy = IDepositBorrowStrategy

export type AaveLikeOpenDepositBorrowDependencies = Omit<
  AaveLikeDepositBorrowDependencies,
  'currentPosition'
> &
  StrategyParams.WithOptionalGetSwap &
  StrategyParams.WithPositionType

export type AaveLikeOpenDepositBorrow = (
  args: AaveLikeOpenDepositBorrowArgs,
  dependencies: AaveLikeOpenDepositBorrowDependencies,
) => Promise<IOpenDepositBorrowStrategy>
