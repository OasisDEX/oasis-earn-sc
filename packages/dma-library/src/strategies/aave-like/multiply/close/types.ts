import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { WithFlashloanToken } from '@dma-library/types/strategy-params'

export type AaveLikeCloseArgs = StrategyParams.WithAaveLikeMultiplyStrategyArgs &
  StrategyParams.WithCloseToCollateralFlag

export type AaveLikeExpandedCloseArgs = AaveLikeCloseArgs &
  StrategyParams.WithProtocolData & {
    collateralToken: AaveLikeCloseArgs['collateralToken'] & { address: string }
    debtToken: AaveLikeCloseArgs['debtToken'] & { address: string }
    flashloanToken: WithFlashloanToken['flashloanToken'] & { address: string }
  }

export type AaveLikeCloseDependencies = StrategyParams.WithAaveLikeMultiplyStrategyDependencies &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type ICloseStrategy = Strategies.IMultiplyStrategy
export type AaveLikeClose = (
  args: AaveLikeCloseArgs,
  dependencies: AaveLikeCloseDependencies,
) => Promise<ICloseStrategy>
