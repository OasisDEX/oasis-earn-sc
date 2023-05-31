import { AavePosition, AAVETokens, AjnaPosition, PositionTransition, SwapData } from '@dma-library'
import { PositionType } from '@dma-library/types'
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
  __mockPrice: BigNumber
  __openPositionSimulation: PositionTransition['simulation']
  __feeWalletBalanceChange: BigNumber
}

export type AavePositionDetails = PositionDetails & {
  getPosition: () => Promise<AavePosition>
}

export type AjnaPositionDetails = PositionDetails & {
  getPosition: () => Promise<AjnaPosition>
}
