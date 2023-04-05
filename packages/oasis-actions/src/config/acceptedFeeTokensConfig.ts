/* Selection of token symbols and addresses that we're happy to accept as a fee */
import { ADDRESSES } from '../helpers/addresses'

export const acceptedTokens = [
  {
    symbol: 'USDC',
    address: [ADDRESSES.main.USDC, ADDRESSES.optimism.USDC],
  },
  {
    symbol: 'DAI',
    address: [ADDRESSES.main.DAI, ADDRESSES.optimism.DAI],
  },
  {
    symbol: 'WETH',
    address: [ADDRESSES.main.WETH, ADDRESSES.optimism.WETH],
  },
  {
    symbol: 'ETH',
    address: [ADDRESSES.main.ETH, ADDRESSES.optimism.ETH],
  },
  {
    symbol: 'STETH',
    address: [ADDRESSES.main.STETH],
  },
  {
    symbol: 'WBTC',
    address: [ADDRESSES.main.WBTC, ADDRESSES.optimism.WBTC],
  },
]
