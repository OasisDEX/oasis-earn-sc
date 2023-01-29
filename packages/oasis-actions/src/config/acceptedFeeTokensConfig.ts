/* Selection of token symbols and addresses that we're happy to accept as a fee */
import { ADDRESSES } from '../helpers/addresses'

export const acceptedTokens = [
  {
    symbol: 'USDC',
    address: ADDRESSES.mainnet.USDC,
  },
  {
    symbol: 'DAI',
    address: ADDRESSES.mainnet,
  },
  {
    symbol: 'WETH',
    address: ADDRESSES.mainnet.WETH,
  },
  {
    symbol: 'ETH',
    address: ADDRESSES.mainnet.ETH,
  },
  {
    symbol: 'STETH',
    address: ADDRESSES.mainnet.STETH,
  },
  {
    symbol: 'WBTC',
    address: ADDRESSES.mainnet.WBTC,
  },
]
