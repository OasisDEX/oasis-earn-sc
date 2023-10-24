/* Selection of token symbols and addresses that we're happy to accept as a fee */
import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'

export const acceptedTokens = [
  {
    symbol: 'USDC',
    address: [
      ADDRESSES.mainnet.common.USDC.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.USDC.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.USDC.toLowerCase(),
      ADDRESSES[Network.BASE].common.USDC.toLowerCase(),
    ],
  },
  {
    symbol: 'DAI',
    address: [
      ADDRESSES.mainnet.common.DAI.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.DAI.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.DAI.toLowerCase(),
      ADDRESSES[Network.BASE].common.DAI.toLowerCase(),
    ],
  },
  {
    symbol: 'WETH',
    address: [
      ADDRESSES.mainnet.common.WETH.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.WETH.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.WETH.toLowerCase(),
      ADDRESSES[Network.BASE].common.WETH.toLowerCase(),
    ],
  },
  {
    symbol: 'ETH',
    address: [
      ADDRESSES.mainnet.common.ETH.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.ETH.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.ETH.toLowerCase(),
      ADDRESSES[Network.BASE].common.ETH.toLowerCase(),
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
      ADDRESSES[Network.ARBITRUM].common.WBTC.toLowerCase(),
    ],
  },
]
