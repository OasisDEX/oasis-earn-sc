import { AavePosition, AAVETokens, PositionTransition, SwapData } from '@dma-library'
import { PositionType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export type AaveV3PositionStrategy = 'ETH/USDC Multiply' | 'WSTETH/ETH Earn'

export type AavePositionStrategy =
  | 'STETH/ETH Earn'
  | 'WBTC/USDC Multiply'
  | 'ETH/USDC Multiply'
  | 'STETH/USDC Multiply'

export type TokenDetails = {
  symbol: AAVETokens
  precision: number
  address: string
}

export type PositionDetails = {
  getPosition: () => Promise<AavePosition>
  proxy: string
  strategy: AavePositionStrategy | AaveV3PositionStrategy
  collateralToken: TokenDetails
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
