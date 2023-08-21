import * as AaveProtocol from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveDepositBorrowArgs = StrategyParams.WithAaveStrategyArgs &
  StrategyParams.WithAaveEntryToken &
  StrategyParams.WithDepositCollateral &
  StrategyParams.WithBorrowDebt

export type AaveV2DepositBorrowDependencies = StrategyParams.WithAaveV2StrategyDependencies &
  AaveProtocol.WithV2Protocol &
  StrategyParams.WithOptionalSwap
export type AaveV3DepositBorrowDependencies = StrategyParams.WithAaveV3StrategyDependencies &
  AaveProtocol.WithV3Protocol &
  StrategyParams.WithOptionalSwap
export type AaveDepositBorrowDependencies =
  | AaveV2DepositBorrowDependencies
  | AaveV3DepositBorrowDependencies

export type IDepositBorrowStrategy = Strategies.IStrategy & {
  simulation: Strategies.IStrategy['simulation'] & Strategies.WithOptionalSwapSimulation
}

export type AaveV2DepositBorrow = (
  args: AaveDepositBorrowArgs,
  dependencies: Omit<AaveV2DepositBorrowDependencies, 'protocol'>,
) => Promise<IDepositBorrowStrategy>

export type AaveV3DepositBorrow = (
  args: AaveDepositBorrowArgs,
  dependencies: Omit<AaveV3DepositBorrowDependencies, 'protocol'>,
) => Promise<IDepositBorrowStrategy>

export type AaveDepositBorrow = (
  args: AaveDepositBorrowArgs,
  dependencies: AaveDepositBorrowDependencies,
) => Promise<IDepositBorrowStrategy>
