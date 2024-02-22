import { Network } from '@deploy-configurations/types/network'
import { AaveLikePositionV2, IOperation, SummerStrategy, SwapData } from '@dma-library/types'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { IBaseSimulatedTransition } from '@domain'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type AaveLikeAdjustArgs = StrategyParams.WithAaveLikeMultiplyStrategyArgs &
  StrategyParams.WithMultiple &
  StrategyParams.WithDeposit &
  Partial<StrategyParams.WithFlashLoanArgs>

export type ExtendedAaveLikeAdjustArgs = AaveLikeAdjustArgs & StrategyParams.WithFlashLoanArgs
export type AaveLikeAdjustDependencies = StrategyParams.WithAaveLikeMultiplyStrategyDependencies &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType &
  Partial<StrategyParams.WithDebug>

export type IAdjustStrategy = Strategies.IMultiplyStrategy & {
  simulation: Strategies.IMultiplyStrategy['simulation'] & Strategies.WithMinConfigurableRiskRatio
}

export type AaveLikeAdjust = (
  args: AaveLikeAdjustArgs,
  dependencies: AaveLikeAdjustDependencies,
) => Promise<IAdjustStrategy>

type AaveLikeAdjustWithExtendedArgs = (
  args: ExtendedAaveLikeAdjustArgs,
  dependencies: AaveLikeAdjustDependencies,
) => Promise<IAdjustStrategy>

export type AaveLikeAdjustUp = AaveLikeAdjustWithExtendedArgs
export type AaveLikeAdjustDown = AaveLikeAdjustWithExtendedArgs

export type BuildOperationArgs = {
  adjustRiskUp: boolean
  swapData: SwapData
  preSwapFee: BigNumber
  simulation: IBaseSimulatedTransition
  collectFeeFrom: 'sourceToken' | 'targetToken'
  reserveEModeCategory?: number | undefined
  args: AaveLikeAdjustArgs
  dependencies: AaveLikeAdjustDependencies
  network: Network
}

export type GenerateArgs = {
  isIncreasingRisk: boolean
  swapData: SwapData
  operation: IOperation
  collectFeeFrom: 'sourceToken' | 'targetToken'
  fee: BigNumber
  simulation: IBaseSimulatedTransition
  args: AaveLikeAdjustArgs
  dependencies: AaveLikeAdjustDependencies
  quoteSwapData: SwapData
}

export type AaveLikeAdjustArgsOmni = AaveLikeAdjustArgs & { position: AaveLikePositionV2 }

export type AaveLikeAdjustDependenciesOmni = AaveLikeAdjustDependencies & {
  provider: ethers.providers.Provider
  operationExecutor: string
}

export type AaveLikeAdjustOmni = (
  args: AaveLikeAdjustArgsOmni,
  dependencies: AaveLikeAdjustDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
