import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import {
  AAVETokens,
  IOperation,
  IPositionTransitionArgs,
  PositionType,
  SwapData,
  WithFlashloanToken,
} from '@dma-library/types'
import { WithV2Addresses, WithV3Addresses } from '@dma-library/types/aave/addresses'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import { IBaseSimulatedTransition, IPosition } from '@domain'
import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

export type AaveAdjustArgs = IPositionTransitionArgs<AAVETokens> & { positionType: PositionType }
export type ExtendedAaveAdjustArgs = AaveAdjustArgs & WithFlashloanToken
export type AaveAdjustSharedDependencies = {
  provider: providers.Provider
  currentPosition: IPosition
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  proxy: Address
  user: Address
  isDPMProxy: boolean
  network: Network
  debug?: boolean
}
export type AaveV2AdjustDependencies = AaveAdjustSharedDependencies &
  WithV2Addresses &
  WithV2Protocol
export type AaveV3AdjustDependencies = AaveAdjustSharedDependencies &
  WithV3Addresses &
  WithV3Protocol
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
export type BuildOperationV2Args = BuildOperationArgs & {
  addresses: AAVEStrategyAddresses
}
export type BuildOperationV3Args = BuildOperationArgs & {
  addresses: AAVEV3StrategyAddresses
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
