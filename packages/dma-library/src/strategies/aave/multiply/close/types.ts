import { AaveLikeCloseArgs } from '@dma-library/strategies/aave-like/multiply/close'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import * as AaveProtocol from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { ethers } from 'ethers'

export type AaveV2CloseDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'protocolType'
> &
  WithV2Protocol &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type AaveV3CloseDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'protocolType'
> &
  WithV3Protocol &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type AaveCloseArgs = AaveLikeCloseArgs & StrategyParams.WithCloseToCollateralFlag

export type AaveCloseDependencies = AaveV2CloseDependencies | AaveV3CloseDependencies

export type ICloseStrategy = Strategies.IMultiplyStrategy

export type AaveV2Close = (
  args: AaveCloseArgs,
  dependencies: Omit<AaveV2CloseDependencies, 'protocol'>,
) => Promise<ICloseStrategy>

export type AaveV3Close = (
  args: AaveCloseArgs,
  dependencies: Omit<AaveV3CloseDependencies, 'protocol'>,
) => Promise<ICloseStrategy>

export type AaveClose = (
  args: AaveCloseArgs,
  dependencies: AaveCloseDependencies,
) => Promise<ICloseStrategy>

export type AaveCloseArgsOmni = AaveCloseArgs & { position: AaveLikePositionV2 }

export type AaveCloseDependenciesOmni = Omit<
  AaveCloseDependencies &
    StrategyParams.WithAaveLikeWithOperationExecutor &
    StrategyParams.WithProvider,
  'protocol'
>

export type AaveCloseOmni = (
  args: AaveCloseArgsOmni,
  dependencies: AaveCloseDependenciesOmni &
    (AaveProtocol.WithV3Protocol | AaveProtocol.WithV2Protocol),
) => Promise<SummerStrategy<AaveLikePositionV2>>

export type AaveCloseActionOmni = (
  args: AaveCloseArgsOmni,
  dependencies: AaveCloseDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
