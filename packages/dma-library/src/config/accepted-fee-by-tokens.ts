/* Selection of token symbols and addresses that we're happy to accept as a fee */
import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'

export const acceptedTokens = [
  {
    symbol: 'USDC',
    address: [
      ADDRESSES.mainnet.common.USDC.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.USDC.toLowerCase(),
    ],
  },
  {
    symbol: 'DAI',
    address: [
      ADDRESSES.mainnet.common.DAI.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.DAI.toLowerCase(),
    ],
  },
  {
    symbol: 'WETH',
    address: [
      ADDRESSES.mainnet.common.WETH.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.WETH.toLowerCase(),
    ],
  },
  {
    symbol: 'ETH',
    address: [
      ADDRESSES.mainnet.common.ETH.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.ETH.toLowerCase(),
    ],
  },
  {
    symbol: 'STETH',
    address: [ADDRESSES.mainnet.common.STETH.toLowerCase()],
  },
  {
    symbol: 'WBTC',
    address: [
      ADDRESSES.mainnet.common.WBTC.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.WBTC.toLowerCase(),
    ],
  },
]
