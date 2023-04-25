import { ADDRESSES } from '@oasisdex/dma-deployments'
import { Network } from '@oasisdex/dma-deployments/types/network'

export const mainnetAddresses = {
  DAI: ADDRESSES[Network.MAINNET].common.DAI,
  ETH: ADDRESSES[Network.MAINNET].common.ETH,
  WETH: ADDRESSES[Network.MAINNET].common.WETH,
  STETH: ADDRESSES[Network.MAINNET].common.STETH,
  WSTETH: ADDRESSES[Network.MAINNET].common.WSTETH,
  WBTC: ADDRESSES[Network.MAINNET].common.WBTC,
  USDC: ADDRESSES[Network.MAINNET].common.USDC,
  feeRecipient: ADDRESSES[Network.MAINNET].common.FeeRecipient,
  chainlinkEthUsdPriceFeed: ADDRESSES[Network.MAINNET].common.ChainlinkEthUsdPriceFeed,
  aave: {
    v2: {
      priceOracle: ADDRESSES[Network.MAINNET].aave.v2.PriceOracle,
      lendingPool: ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
      protocolDataProvider: ADDRESSES[Network.MAINNET].aave.v2.ProtocolDataProvider,
    },
    v3: {
      aaveOracle: ADDRESSES[Network.MAINNET].aave.v3.AaveOracle,
      pool: ADDRESSES[Network.MAINNET].aave.v3.Pool,
      poolDataProvider: ADDRESSES[Network.MAINNET].aave.v3.AaveProtocolDataProvider,
    },
  },
}
