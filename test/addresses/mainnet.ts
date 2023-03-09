import { ADDRESSES } from '@oasisdex/oasis-actions/src/helpers/addresses'

export const mainnetAddresses = {
  DAI: ADDRESSES.main.DAI,
  ETH: ADDRESSES.main.ETH,
  WETH: ADDRESSES.main.WETH,
  STETH: ADDRESSES.main.STETH,
  WSTETH: ADDRESSES.main.WSTETH,
  WBTC: ADDRESSES.main.WBTC,
  USDC: ADDRESSES.main.USDC,
  feeRecipient: ADDRESSES.main.feeRecipient,
  chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
  aave: {
    v2: {
      priceOracle: ADDRESSES.main.aave.v2.PriceOracle,
      lendingPool: ADDRESSES.main.aave.v2.LendingPool,
      protocolDataProvider: ADDRESSES.main.aave.v2.ProtocolDataProvider,
    },
    v3: {
      aaveOracle: ADDRESSES.main.aave.v3.AaveOracle,
      pool: ADDRESSES.main.aave.v3.Pool,
      poolDataProvider: ADDRESSES.main.aave.v3.PoolDataProvider,
    },
  },
}
