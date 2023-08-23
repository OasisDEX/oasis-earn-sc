import {
  AaveDepositBorrowArgs,
  AaveV2DepositBorrowDependencies,
  AaveV3DepositBorrowDependencies,
} from '@dma-library/strategies/aave/borrow/deposit-borrow'
import { IDepositBorrowStrategy } from '@dma-library/strategies/aave/borrow/deposit-borrow/types'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveOpenDepositBorrowArgs = AaveDepositBorrowArgs

type IOpenDepositBorrowStrategy = IDepositBorrowStrategy

export type AaveV2OpenDepositBorrowDependencies = Omit<
  AaveV2DepositBorrowDependencies,
  'currentPosition'
> &
  StrategyParams.WithOptionalSwap &
  StrategyParams.WithPositionType
export type AaveV3OpenDepositBorrowDependencies = Omit<
  AaveV3DepositBorrowDependencies,
  'currentPosition'
> &
  StrategyParams.WithPositionType
export type AaveOpenDepositBorrowDependencies =
  | AaveV2OpenDepositBorrowDependencies
  | AaveV3OpenDepositBorrowDependencies

export type AaveV2OpenDepositBorrow = (
  args: AaveOpenDepositBorrowArgs,
  dependencies: Omit<AaveV2OpenDepositBorrowDependencies, 'protocol'>,
) => Promise<IOpenDepositBorrowStrategy>

export type AaveV3OpenDepositBorrow = (
  args: AaveOpenDepositBorrowArgs,
  dependencies: Omit<AaveV3OpenDepositBorrowDependencies, 'protocol'>,
) => Promise<IOpenDepositBorrowStrategy>

export type AaveOpenDepositBorrow = (
  args: AaveOpenDepositBorrowArgs,
  dependencies: AaveOpenDepositBorrowDependencies,
) => Promise<IOpenDepositBorrowStrategy>
