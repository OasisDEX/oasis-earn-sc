import BigNumber from 'bignumber.js'

import { mainnetAddresses } from '../../addresses'
import { TokenDetails } from '../types/positionDetails'

export const SLIPPAGE = new BigNumber(0.25)
export const MULTIPLE = new BigNumber(1.5)
export const EMODE_MULTIPLE = new BigNumber(6)

export const USDC: TokenDetails = {
  symbol: 'USDC' as const,
  precision: 6,
  address: mainnetAddresses.USDC,
}
export const ETH: TokenDetails = {
  symbol: 'ETH' as const,
  precision: 18,
  address: mainnetAddresses.ETH,
}

export const STETH: TokenDetails = {
  symbol: 'STETH' as const,
  precision: 18,
  address: mainnetAddresses.STETH,
}

export const WSTETH: TokenDetails = {
  symbol: 'WSTETH' as const,
  precision: 18,
  address: mainnetAddresses.WSTETH,
}

export const WBTC: TokenDetails = {
  symbol: 'WBTC' as const,
  precision: 8,
  address: mainnetAddresses.WBTC,
}
