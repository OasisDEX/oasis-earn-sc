/* Selection of token symbols and addresses that we're happy to accept as a fee */
import { ADDRESSES } from '../utils/addresses'

export const acceptedTokens = [
  {
    symbol: 'USDC',
    address: ADDRESSES.main.USDC,
  },
  {
    symbol: 'DAI',
    address: ADDRESSES.main,
  },
  {
    symbol: 'WETH',
    address: ADDRESSES.main.WETH,
  },
  {
    symbol: 'ETH',
    address: ADDRESSES.main.ETH,
  },
  {
    symbol: 'STETH',
    address: ADDRESSES.main.STETH,
  },
  {
    symbol: 'WBTC',
    address: ADDRESSES.main.WBTC,
  },
]
