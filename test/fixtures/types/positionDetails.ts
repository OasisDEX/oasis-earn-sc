import {
  AavePosition,
  AAVETokens,
  IPositionTransition,
  SwapData,
} from '@oasisdex/oasis-actions/src'
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
  __mockPrice: BigNumber
  __openPositionSimulation: IPositionTransition['simulation']
  __feeWalletBalanceChange: BigNumber
}
