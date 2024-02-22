import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import * as AaveProtocol from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AavePaybackWithdrawArgs = StrategyParams.WithAaveStrategyArgs &
  StrategyParams.WithWithdrawCollateral &
  StrategyParams.WithPaybackDebt

export type AaveV2PaybackWithdrawDependencies = Omit<
  StrategyParams.WithAaveLikeStrategyDependencies,
  'protocolType'
> &
  WithV2Protocol
export type AaveV3PaybackWithdrawDependencies = Omit<
  StrategyParams.WithAaveLikeStrategyDependencies,
  'protocolType'
> &
  WithV3Protocol
export type AavePaybackWithdrawDependencies =
  | AaveV2PaybackWithdrawDependencies
  | AaveV3PaybackWithdrawDependencies

export type AaveV2PaybackWithdraw = (
  args: AavePaybackWithdrawArgs,
  dependencies: Omit<AaveV2PaybackWithdrawDependencies, 'protocol'>,
) => Promise<Strategies.IStrategy>

export type AaveV3PaybackWithdraw = (
  args: AavePaybackWithdrawArgs,
  dependencies: Omit<AaveV3PaybackWithdrawDependencies, 'protocol'>,
) => Promise<Strategies.IStrategy>

export type AavePaybackWithdraw = (
  args: AavePaybackWithdrawArgs,
  dependencies: AavePaybackWithdrawDependencies,
) => Promise<Strategies.IStrategy>

export type AavePaybackWithdrawArgsOmni = AavePaybackWithdrawArgs & {
  position: AaveLikePositionV2
}

export type AavePaybackWithdrawDependenciesOmni = Omit<
  AavePaybackWithdrawDependencies & {
    operationExecutor: string
  },
  'protocol'
>

export type AavePaybackWithdrawOmni = (
  args: AavePaybackWithdrawArgsOmni,
  dependencies: AavePaybackWithdrawDependenciesOmni &
    (AaveProtocol.WithV3Protocol | AaveProtocol.WithV2Protocol),
) => Promise<SummerStrategy<AaveLikePositionV2>>

export type AavePaybackWithdrawActionOmni = (
  args: AavePaybackWithdrawArgsOmni,
  dependencies: AavePaybackWithdrawDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
