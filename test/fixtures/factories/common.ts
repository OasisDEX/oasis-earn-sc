import BigNumber from 'bignumber.js'

import { mainnetAddresses } from '../../addresses/mainnet'
import { TokenDetails } from '../types/positionDetails'

export const UNISWAP_TEST_SLIPPAGE = new BigNumber(0.25)
export const SLIPPAGE = new BigNumber(0.05)
export const MULTIPLE = new BigNumber(2)
export const EMODE_MULTIPLE = new BigNumber(9.5)

export class USDC {
  static symbol = 'USDC' as const
  static precision = 6
  public symbol = USDC.symbol
  public precision = USDC.precision
  public address: string
  constructor(public addresses: Record<'USDC', string>) {
    this.address = addresses.USDC
  }
}

export class ETH {
  static symbol = 'ETH' as const
  static precision = 18
  public symbol = ETH.symbol
  public precision = ETH.precision
  public address: string
  constructor(public addresses: Record<'WETH', string>) {
    this.address = addresses.WETH
  }
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
