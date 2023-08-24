import { Network } from '@deploy-configurations/types/network'
import {
  AAVETokens,
  IOperation,
  IPositionTransitionArgs,
  SwapData,
  WithFlashloanToken,
  WithPositionType,
} from '@dma-library/types'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import {
  WithAaveStrategyDependencies,
  WithDebug,
  WithSwap,
} from '@dma-library/types/strategy-params'
import { IBaseSimulatedTransition } from '@domain'
import BigNumber from 'bignumber.js'

export type AaveAdjustArgs = IPositionTransitionArgs<AAVETokens> & WithPositionType
export type ExtendedAaveAdjustArgs = AaveAdjustArgs & WithFlashloanToken
export type AaveAdjustSharedDependencies = WithAaveStrategyDependencies & WithSwap & WithDebug
export type AaveV2AdjustDependencies = AaveAdjustSharedDependencies & WithV2Protocol
export type AaveV3AdjustDependencies = AaveAdjustSharedDependencies & WithV3Protocol
export type AaveAdjustDependencies = AaveV2AdjustDependencies | AaveV3AdjustDependencies

export type BuildOperationArgs = {
  adjustRiskUp: boolean
  swapData: SwapData
  simulatedPositionTransition: IBaseSimulatedTransition
  collectFeeFrom: 'sourceToken' | 'targetToken'
  reserveEModeCategory?: number | undefined
  args: AaveAdjustArgs
  dependencies: AaveAdjustDependencies
  network: Network
}

export type GenerateTransitionArgs = {
  isIncreasingRisk: boolean
  swapData: SwapData
  operation: IOperation
  collectFeeFrom: 'sourceToken' | 'targetToken'
  fee: BigNumber
  simulatedPositionTransition: IBaseSimulatedTransition
  args: AaveAdjustArgs
  dependencies: AaveAdjustDependencies
  quoteSwapData: SwapData
}
