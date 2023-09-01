import { AaveLikeOpenArgs } from '@dma-library/strategies/aave-like/multiply/open'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveV2OpenDependencies = Omit<
  StrategyParams.WithAaveMultiplyStrategyDependencies,
  'currentPosition'
> &
  WithV2Protocol &
  StrategyParams.WithSwap &
  StrategyParams.WithPositionType
export type AaveV3OpenDependencies = Omit<
  StrategyParams.WithAaveMultiplyStrategyDependencies,
  'currentPosition'
> &
  WithV3Protocol &
  StrategyParams.WithSwap &
  StrategyParams.WithPositionType
export type AaveOpenDependencies = AaveV2OpenDependencies | AaveV3OpenDependencies
export type AaveOpenArgs = AaveLikeOpenArgs

export type IOpenStrategy = Strategies.IMultiplyStrategy
export type AaveOpen = (
  args: AaveOpenArgs,
  dependencies: AaveOpenDependencies,
) => Promise<IOpenStrategy>
