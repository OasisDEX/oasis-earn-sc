import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { RiskRatio } from '@domain'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type AaveLikeOpenArgs = StrategyParams.WithAaveLikeMultiplyStrategyArgs &
  StrategyParams.WithDeposit &
  StrategyParams.WithMultiple &
  Partial<StrategyParams.WithFlashLoanArgs>

export type AaveLikeOpenDependencies = Omit<
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies,
  'currentPosition'
> &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type IOpenStrategy = Strategies.IMultiplyStrategy

export type AaveLikeOpen = (
  args: AaveLikeOpenArgs,
  dependencies: AaveLikeOpenDependencies,
) => Promise<IOpenStrategy>

export type AaveLikeOpenArgsOmni = AaveLikeOpenArgs & {
  position: AaveLikePositionV2
  multiple: RiskRatio
  depositedByUser: {
    collateralInWei: BigNumber
    debtInWei: BigNumber
  }
}

export type AaveLikeOpenDependenciesOmni = AaveLikeOpenDependencies & {
  provider: ethers.providers.Provider
  operationExecutor: string
}

export type AaveLikeOpenOmni = (
  args: AaveLikeOpenArgsOmni,
  dependencies: AaveLikeOpenDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
