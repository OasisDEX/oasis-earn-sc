import { AavePosition, AAVETokens, AjnaPosition, PositionTransition, SwapData } from '@dma-library'
import { OpenMultiplyDependencies } from '@dma-library/strategies/ajna/multiply/open'
import { PositionType, Strategy } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export type AjnaPositions = 'ETH/USDC Multiply'

export type AaveV3PositionStrategy = 'ETH/USDC Multiply' | 'WSTETH/ETH Earn'

export type AavePositionStrategy =
  | 'STETH/ETH Earn'
  | 'WBTC/USDC Multiply'
  | 'ETH/USDC Multiply'
  | 'STETH/USDC Multiply'

export type PositionVariants = AaveV3PositionStrategy | AavePositionStrategy | AjnaPositions

export type TokenDetails = {
  symbol: AAVETokens
  precision: number
  address: string
}

type PositionDetails = {
  proxy: string
  variant: PositionVariants
  /** @deprecated use variant instead */
  strategy: PositionVariants
  collateralToken: TokenDetails
  /** debtToken === quoteToken on Ajna */
  debtToken: TokenDetails
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  __positionType: PositionType
  /** @deprecated use __feesCollected instead */
  __feeWalletBalanceChange: BigNumber
  __feesCollected: BigNumber
  /** @deprecated use __mockMarketPrice instead */
  __mockPrice: BigNumber
  __mockMarketPrice: BigNumber
}

export type AavePositionDetails = PositionDetails & {
  getPosition: () => Promise<AavePosition>
  __openPositionSimulation: PositionTransition['simulation']
}

export type AjnaPositionDetails = PositionDetails & {
  getPosition: OpenMultiplyDependencies['getPosition']
  __openPositionSimulation: Strategy<AjnaPosition>['simulation']
}
