import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as AaveProtocol from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveDepositBorrowArgs = StrategyParams.WithAaveStrategyArgs &
  StrategyParams.WithAaveEntryToken &
  StrategyParams.WithDepositCollateral &
  StrategyParams.WithBorrowDebt

export type AaveV2DepositBorrowDependencies = Omit<
  StrategyParams.WithAaveLikeStrategyDependencies,
  'protocolType'
> &
  AaveProtocol.WithV2Protocol &
  StrategyParams.WithOptionalGetSwap
export type AaveV3DepositBorrowDependencies = Omit<
  StrategyParams.WithAaveLikeStrategyDependencies,
  'protocolType'
> &
  AaveProtocol.WithV3Protocol &
  StrategyParams.WithOptionalGetSwap
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

export type AaveDepositBorrowArgsOmni = AaveDepositBorrowArgs & {
  position: AaveLikePositionV2
}

export type AaveDepositBorrowDependenciesOmni = Omit<
  AaveDepositBorrowDependencies & {
    operationExecutor: string
  },
  'protocol'
>

export type AaveDepositBorrowOmni = (
  args: AaveDepositBorrowArgsOmni,
  dependencies: AaveDepositBorrowDependenciesOmni &
    (AaveProtocol.WithV3Protocol | AaveProtocol.WithV2Protocol),
) => Promise<SummerStrategy<AaveLikePositionV2>>

export type AaveDepositBorrowActionOmni = (
  args: AaveDepositBorrowArgsOmni,
  dependencies: AaveDepositBorrowDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
