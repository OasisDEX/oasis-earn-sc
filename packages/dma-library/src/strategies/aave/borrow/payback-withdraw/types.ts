import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import { IStrategy } from '@dma-library/types/strategies'
import {
  WithAaveStrategyArgs,
  WithAaveStrategyDependencies,
  WithPaybackDebt,
  WithWithdrawCollateral,
} from '@dma-library/types/strategy-params'

export type AavePaybackWithdrawArgs = WithAaveStrategyArgs &
  WithWithdrawCollateral &
  WithPaybackDebt

export type AaveV2PaybackWithdrawDependencies = WithAaveStrategyDependencies & WithV2Protocol
export type AaveV3PaybackWithdrawDependencies = WithAaveStrategyDependencies & WithV3Protocol
export type AavePaybackWithdrawDependencies =
  | AaveV2PaybackWithdrawDependencies
  | AaveV3PaybackWithdrawDependencies

export type AaveV2PaybackWithdraw = (
  args: AavePaybackWithdrawArgs,
  dependencies: Omit<AaveV2PaybackWithdrawDependencies, 'protocol'>,
) => Promise<IStrategy>

export type AaveV3PaybackWithdraw = (
  args: AavePaybackWithdrawArgs,
  dependencies: Omit<AaveV3PaybackWithdrawDependencies, 'protocol'>,
) => Promise<IStrategy>

export type AavePaybackWithdraw = (
  args: AavePaybackWithdrawArgs,
  dependencies: AavePaybackWithdrawDependencies,
) => Promise<IStrategy>
