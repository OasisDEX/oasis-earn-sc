/* Selection of token symbols and addresses that we're happy to accept as a fee */
import { ADDRESSES } from '@oasisdex/addresses'
import { Network } from '@oasisdex/dma-deployments/types/network'

export const acceptedTokens = [
  {
    symbol: 'USDC',
    address: [ADDRESSES.mainnet.common.USDC, ADDRESSES[Network.OPT_MAINNET].common.USDC],
  },
  {
    symbol: 'DAI',
    address: [ADDRESSES.mainnet.common.DAI, ADDRESSES[Network.OPT_MAINNET].common.DAI],
  },
  {
    symbol: 'WETH',
    address: [ADDRESSES.mainnet.common.WETH, ADDRESSES[Network.OPT_MAINNET].common.WETH],
  },
  {
    symbol: 'ETH',
    address: [ADDRESSES.mainnet.common.ETH, ADDRESSES[Network.OPT_MAINNET].common.ETH],
  },
  {
    symbol: 'STETH',
    address: [ADDRESSES.mainnet.common.STETH],
  },
  {
    symbol: 'WBTC',
    address: [ADDRESSES.mainnet.common.WBTC, ADDRESSES[Network.OPT_MAINNET].common.WBTC],
  },
]
