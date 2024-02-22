import {
  AaveLikeAdjustArgs,
  IAdjustStrategy,
} from '@dma-library/strategies/aave-like/multiply/adjust/types'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import * as AaveProtocol from '@dma-library/types/aave/protocol'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { ethers } from 'ethers'

export type SharedAaveAdjustDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'protocolType'
> &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType &
  Partial<StrategyParams.WithDebug>

export type AaveV2AdjustDependencies = SharedAaveAdjustDependencies & WithV2Protocol
export type AaveV3AdjustDependencies = SharedAaveAdjustDependencies & WithV3Protocol
export type AaveAdjustDependencies = AaveV2AdjustDependencies | AaveV3AdjustDependencies
export type AaveAdjustArgs = AaveLikeAdjustArgs

export type AaveV2Adjust = (
  args: AaveAdjustArgs,
  dependencies: Omit<AaveV2AdjustDependencies, 'protocol'>,
) => Promise<IAdjustStrategy>

export type AaveV3Adjust = (
  args: AaveAdjustArgs,
  dependencies: Omit<AaveV3AdjustDependencies, 'protocol'>,
) => Promise<IAdjustStrategy>

export type AaveAdjust = (
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
) => Promise<IAdjustStrategy>

export type AaveAdjustArgsOmni = AaveAdjustArgs & { position: AaveLikePositionV2 }

export type AaveAdjustDependenciesOmni = Omit<
  AaveAdjustDependencies & {
    provider: ethers.providers.Provider
    operationExecutor: string
  },
  'protocol'
>

export type AaveAdjustOmni = (
  args: AaveAdjustArgsOmni,
  dependencies: AaveAdjustDependenciesOmni &
    (AaveProtocol.WithV3Protocol | AaveProtocol.WithV2Protocol),
) => Promise<SummerStrategy<AaveLikePositionV2>>

export type AaveAdjustActionOmni = (
  args: AaveAdjustArgsOmni,
  dependencies: AaveAdjustDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
