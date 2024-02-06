/* Selection of token symbols and addresses that we're happy to accept as a fee */
import { ADDRESSES } from '@oasisdex/deploy-configurations/addresses'
import { Network } from '@oasisdex/deploy-configurations/types'

export const acceptedTokens = [
  {
    symbol: 'USDC',
    address: [
      ADDRESSES[Network.MAINNET].common.USDC.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.USDC.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.USDC.toLowerCase(),
      ADDRESSES[Network.BASE].common.USDC.toLowerCase(),
    ],
  },
  {
    symbol: 'DAI',
    address: [
      ADDRESSES[Network.MAINNET].common.DAI.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.DAI.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.DAI.toLowerCase(),
      ADDRESSES[Network.BASE].common.DAI.toLowerCase(),
    ],
  },
  {
    symbol: 'WETH',
    address: [
      ADDRESSES[Network.MAINNET].common.WETH.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.WETH.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.WETH.toLowerCase(),
      ADDRESSES[Network.BASE].common.WETH.toLowerCase(),
    ],
  },
  {
    symbol: 'ETH',
    address: [
      ADDRESSES[Network.MAINNET].common.ETH.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.ETH.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.ETH.toLowerCase(),
      ADDRESSES[Network.BASE].common.ETH.toLowerCase(),
    ],
  },
  {
    symbol: 'STETH',
    address: [ADDRESSES[Network.MAINNET].common.STETH.toLowerCase()],
  },
  {
    symbol: 'WBTC',
    address: [
      ADDRESSES[Network.MAINNET].common.WBTC.toLowerCase(),
      ADDRESSES[Network.OPTIMISM].common.WBTC.toLowerCase(),
      ADDRESSES[Network.ARBITRUM].common.WBTC.toLowerCase(),
    ],
  },
]
