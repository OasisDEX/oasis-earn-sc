/* Selection of token symbols and addresses that we're happy to accept as a fee */
import { ADDRESSES } from '../helpers/addresses'

export const acceptedTokenSymbols = ['ETH', 'WETH', 'USDT', 'USDC', 'WBTC', 'DAI']
export const acceptedTokenAddresses = [
  ADDRESSES.main.ETH,
  ADDRESSES.main.WETH,
  ADDRESSES.main.USDT,
  ADDRESSES.main.USDC,
  ADDRESSES.main.WBTC,
  ADDRESSES.main.DAI,
]
