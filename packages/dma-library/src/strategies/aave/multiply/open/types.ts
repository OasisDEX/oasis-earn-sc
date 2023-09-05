import { AaveLikeOpenArgs } from '@dma-library/strategies/aave-like/multiply/open'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'

export type AaveV2OpenDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'currentPosition' | 'protocolType'
> &
  WithV2Protocol &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType
export type AaveV3OpenDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'currentPosition' | 'protocolType'
> &
  WithV3Protocol &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType
export type AaveOpenDependencies = AaveV2OpenDependencies | AaveV3OpenDependencies
export type AaveOpenArgs = AaveLikeOpenArgs

export type IOpenStrategy = Strategies.IMultiplyStrategy

export type AaveV2Open = (
  args: AaveOpenArgs,
  dependencies: Omit<AaveV2OpenDependencies, 'protocol'>,
) => Promise<IOpenStrategy>

export type AaveV3Open = (
  args: AaveOpenArgs,
  dependencies: Omit<AaveV3OpenDependencies, 'protocol'>,
) => Promise<IOpenStrategy>

export type AaveOpen = (
  args: AaveOpenArgs,
  dependencies: AaveOpenDependencies,
) => Promise<IOpenStrategy>
