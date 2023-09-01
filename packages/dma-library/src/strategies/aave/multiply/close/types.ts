import { AaveLikeCloseArgs } from '@dma-library/strategies/aave-like/multiply/close'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveV2CloseDependencies = StrategyParams.WithAaveLikeMultiplyStrategyDependencies &
  WithV2Protocol &
  StrategyParams.WithSwap &
  StrategyParams.WithPositionType

export type AaveV3CloseDependencies = StrategyParams.WithAaveLikeMultiplyStrategyDependencies &
  WithV3Protocol &
  StrategyParams.WithSwap &
  StrategyParams.WithPositionType

export type AaveCloseArgs = AaveLikeCloseArgs & StrategyParams.WithCloseToCollateralFlag

export type AaveCloseDependencies = AaveV2CloseDependencies | AaveV3CloseDependencies

export type ICloseStrategy = Strategies.IMultiplyStrategy
export type AaveClose = (
  args: AaveCloseArgs,
  dependencies: AaveCloseDependencies,
) => Promise<ICloseStrategy>
