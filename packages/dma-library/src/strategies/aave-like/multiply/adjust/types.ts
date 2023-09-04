import { Network } from '@deploy-configurations/types/network'
import { IOperation, SwapData } from '@dma-library/types'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { IBaseSimulatedTransition } from '@domain'
import BigNumber from 'bignumber.js'

export type AaveLikeAdjustArgs = StrategyParams.WithAaveLikeMultiplyStrategyArgs &
  StrategyParams.WithMultiple &
  StrategyParams.WithDeposit
export type ExtendedAaveLikeAdjustArgs = AaveLikeAdjustArgs & StrategyParams.WithFlashloanToken
export type AaveLikeAdjustSharedDependencies =
  StrategyParams.WithAaveLikeMultiplyStrategyDependencies &
    StrategyParams.WithSwap &
    StrategyParams.WithPositionType &
    Partial<StrategyParams.WithDebug>
export type AaveLikeV2AdjustDependencies = AaveLikeAdjustSharedDependencies & WithV2Protocol
export type AaveLikeV3AdjustDependencies = AaveLikeAdjustSharedDependencies & WithV3Protocol
export type AaveLikeAdjustDependencies = AaveLikeV2AdjustDependencies | AaveLikeV3AdjustDependencies

export type IAdjustStrategy = Strategies.IMultiplyStrategy

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
  simulatedPositionTransition: IBaseSimulatedTransition
  collectFeeFrom: 'sourceToken' | 'targetToken'
  reserveEModeCategory?: number | undefined
  args: AaveLikeAdjustArgs
  dependencies: AaveLikeAdjustDependencies
  network: Network
}

export type GenerateTransitionArgs = {
  isIncreasingRisk: boolean
  swapData: SwapData
  operation: IOperation
  collectFeeFrom: 'sourceToken' | 'targetToken'
  fee: BigNumber
  simulatedPositionTransition: IBaseSimulatedTransition
  args: AaveLikeAdjustArgs
  dependencies: AaveLikeAdjustDependencies
  quoteSwapData: SwapData
}
