import { addressesByNetwork } from '@dma-common/test-utils'
import { Network } from '@dma-deployments/types/network'
import BigNumber from 'bignumber.js'

import { TokenDetails } from '../types/position-details'

const mainnetAddressesForTests = addressesByNetwork(Network.MAINNET)

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

export class STETH {
  static symbol = 'STETH' as const
  static precision = 18
  public symbol = STETH.symbol
  public precision = STETH.precision
  public address: string
  constructor(public addresses: Record<'STETH', string>) {
    this.address = addresses.STETH
  }
}

export class WSTETH {
  static symbol = 'WSTETH' as const
  static precision = 18
  public symbol = WSTETH.symbol
  public precision = WSTETH.precision
  public address: string
  constructor(public addresses: Record<'WSTETH', string>) {
    this.address = addresses.WSTETH
  }
}

export const WBTC: TokenDetails = {
  symbol: 'WBTC' as const,
  precision: 8,
  address: mainnetAddressesForTests.WBTC,
}
