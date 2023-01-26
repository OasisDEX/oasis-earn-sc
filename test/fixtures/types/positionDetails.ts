import { AavePosition, AAVETokens, SwapData } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'

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
  strategy: AavePositionStrategy
  collateralToken: TokenDetails
  debtToken: TokenDetails
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
}
