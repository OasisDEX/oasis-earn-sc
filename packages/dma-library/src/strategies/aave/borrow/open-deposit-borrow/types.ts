import {
  AaveDepositBorrowArgs,
  AaveV2DepositBorrowDependencies,
  AaveV3DepositBorrowDependencies,
} from '@dma-library/strategies/aave/borrow/deposit-borrow'
import { IDepositBorrowStrategy } from '@dma-library/strategies/aave/borrow/deposit-borrow/types'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as AaveProtocol from '@dma-library/types/aave/protocol'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveOpenDepositBorrowArgs = AaveDepositBorrowArgs

type IOpenDepositBorrowStrategy = IDepositBorrowStrategy

export type AaveV2OpenDepositBorrowDependencies = Omit<
  AaveV2DepositBorrowDependencies,
  'currentPosition' | 'protocolType'
> &
  StrategyParams.WithOptionalGetSwap &
  StrategyParams.WithPositionType
export type AaveV3OpenDepositBorrowDependencies = Omit<
  AaveV3DepositBorrowDependencies,
  'currentPosition' | 'protocolType'
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

export type AaveOpenDepositBorrowArgsOmni = AaveOpenDepositBorrowArgs & {
  position: AaveLikePositionV2
}

export type AaveOpenDepositBorrowDependenciesOmni = Omit<
  AaveOpenDepositBorrowDependencies & {
    operationExecutor: string
  },
  'protocol'
>

export type AaveOpenDepositBorrowOmni = (
  args: AaveOpenDepositBorrowArgsOmni,
  dependencies: AaveOpenDepositBorrowDependenciesOmni &
    (AaveProtocol.WithV3Protocol | AaveProtocol.WithV2Protocol),
) => Promise<SummerStrategy<AaveLikePositionV2>>

export type AaveOpenDepositBorrowActionOmni = (
  args: AaveOpenDepositBorrowArgsOmni,
  dependencies: AaveOpenDepositBorrowDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
