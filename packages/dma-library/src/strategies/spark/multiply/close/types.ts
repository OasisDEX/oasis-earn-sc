import { AaveLikeCloseArgs } from '@dma-library/strategies/aave-like/multiply/close'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { ethers } from 'ethers'

export type SparkCloseDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'protocolType'
> &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type SparkCloseArgs = AaveLikeCloseArgs & StrategyParams.WithCloseToCollateralFlag

export type ICloseStrategy = Strategies.IMultiplyStrategy
export type SparkClose = (
  args: SparkCloseArgs,
  dependencies: SparkCloseDependencies,
) => Promise<ICloseStrategy>

export type SparkCloseArgsOmni = SparkCloseArgs & {
  position: AaveLikePositionV2
}

export type SparkCloseDependenciesOmni = SparkCloseDependencies & {
  provider: ethers.providers.Provider
  operationExecutor: string
}

export type SparkCloseOmni = (
  args: SparkCloseArgsOmni,
  dependencies: SparkCloseDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
