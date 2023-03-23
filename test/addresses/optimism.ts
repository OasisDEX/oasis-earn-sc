import { ADDRESSES } from '@oasisdex/oasis-actions/src/helpers/addresses'

export const optimismAddresses = {
  DAI: ADDRESSES.optimism.DAI,
  ETH: ADDRESSES.optimism.ETH,
  WETH: ADDRESSES.optimism.WETH,
  WSTETH: ADDRESSES.optimism.WSTETH,
  WBTC: ADDRESSES.optimism.WBTC,
  USDC: ADDRESSES.optimism.USDC,
  feeRecipient: ADDRESSES.optimism.feeRecipient,
  chainlinkEthUsdPriceFeed: ADDRESSES.optimism.chainlinkEthUsdPriceFeed,
  aave: {
    v3: {
      aaveOracle: ADDRESSES.optimism.aave.v3.AaveOracle,
      pool: ADDRESSES.optimism.aave.v3.Pool,
      poolDataProvider: ADDRESSES.optimism.aave.v3.PoolDataProvider,
    },
  },
}
