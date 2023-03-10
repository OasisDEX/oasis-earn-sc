import BigNumber from 'bignumber.js'

import { TokenDetails } from '../types/positionDetails'

export const UNISWAP_TEST_SLIPPAGE = new BigNumber(0.25)
export const SLIPPAGE = new BigNumber(0.05)
export const MULTIPLE = new BigNumber(2)
export const EMODE_MULTIPLE = new BigNumber(9.5)

export const USDC: TokenDetails = {
  symbol: 'USDC' as const,
  precision: 6,
}
export const ETH: TokenDetails = {
  symbol: 'ETH' as const,
  precision: 18,
  /* We use WETH address throughout operations and for fee collection */
}

export const STETH: TokenDetails = {
  symbol: 'STETH' as const,
  precision: 18,
}

export const WSTETH: TokenDetails = {
  symbol: 'WSTETH' as const,
  precision: 18,
}

export const WBTC: TokenDetails = {
  symbol: 'WBTC' as const,
  precision: 8,
}
