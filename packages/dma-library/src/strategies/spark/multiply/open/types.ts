import { AAVETokens, PositionType } from '@dma-library/types'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import { WithAaveMultiplyStrategyDependencies, WithSwap } from '@dma-library/types/strategy-params'
import { IRiskRatio } from '@domain'
import BigNumber from 'bignumber.js'

export interface AaveOpenArgs {
  depositedByUser?: {
    collateralToken?: { amountInBaseUnit: BigNumber }
    debtToken?: { amountInBaseUnit: BigNumber }
  }
  multiple: IRiskRatio
  slippage: BigNumber
  positionType: PositionType
  collateralToken: { symbol: AAVETokens; precision?: number }
  debtToken: { symbol: AAVETokens; precision?: number }
}

export type AaveV2OpenDependencies = Omit<WithAaveMultiplyStrategyDependencies, 'currentPosition'> &
  WithV2Protocol &
  WithSwap
export type AaveV3OpenDependencies = Omit<WithAaveMultiplyStrategyDependencies, 'currentPosition'> &
  WithV3Protocol &
  WithSwap
export type AaveOpenDependencies = AaveV2OpenDependencies | AaveV3OpenDependencies
