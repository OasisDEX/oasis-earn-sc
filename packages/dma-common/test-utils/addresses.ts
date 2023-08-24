import { ADDRESS_ZERO, ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { constants } from 'ethers'

type NetworkAddressesForNetwork<T extends Network> = T extends Network.MAINNET
  ? MainnetAddresses
  : T extends Network.OPTIMISM
  ? OptMainnetAddresses
  : never
export function addressesByNetwork<T extends Network>(network: T): NetworkAddressesForNetwork<T> {
  switch (network) {
    case Network.MAINNET:
      return testAddresses[Network.MAINNET] as NetworkAddressesForNetwork<T>
    case Network.OPTIMISM:
      return testAddresses[Network.OPTIMISM] as NetworkAddressesForNetwork<T>
    case Network.ARBITRUM:
      return testAddresses[Network.ARBITRUM] as NetworkAddressesForNetwork<T>
    default:
      throw new Error(`Network ${network} not supported`)
  }
}

// These addresses are used to map the addresses in the library
// Into a form expected by our tests
// TODO: Use addresses from our deploy system should be the source of truth for Addresses
if (!ADDRESSES[Network.MAINNET].aave.v2) throw new Error('Missing aave v2 addresses for mainnet')
const testAddresses = {
  [Network.MAINNET]: {
    DAI: ADDRESSES[Network.MAINNET].common.DAI,
    ETH: ADDRESSES[Network.MAINNET].common.ETH,
    WETH: ADDRESSES[Network.MAINNET].common.WETH,
    STETH: ADDRESSES[Network.MAINNET].common.STETH,
    WSTETH: ADDRESSES[Network.MAINNET].common.WSTETH,
    WBTC: ADDRESSES[Network.MAINNET].common.WBTC,
    USDC: ADDRESSES[Network.MAINNET].common.USDC,
    feeRecipient: ADDRESSES[Network.MAINNET].common.FeeRecipient,
    chainlinkEthUsdPriceFeed: ADDRESSES[Network.MAINNET].common.ChainlinkPriceOracle_ETHUSD,
    priceOracle: ADDRESSES[Network.MAINNET].aave.v2.Oracle,
    lendingPool: ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
    protocolDataProvider: ADDRESSES[Network.MAINNET].aave.v2.PoolDataProvider,
    aaveOracle: ADDRESSES[Network.MAINNET].aave.v3.Oracle,
    pool: ADDRESSES[Network.MAINNET].aave.v3.LendingPool,
    poolDataProvider: ADDRESSES[Network.MAINNET].aave.v3.PoolDataProvider,
    CBETH: ADDRESSES[Network.MAINNET].common.CBETH,
    RETH: ADDRESSES[Network.MAINNET].common.RETH,
  },
  [Network.OPTIMISM]: {
    DAI: ADDRESSES[Network.OPTIMISM].common.DAI,
    ETH: ADDRESSES[Network.OPTIMISM].common.ETH,
    WETH: ADDRESSES[Network.OPTIMISM].common.WETH,
    STETH: constants.AddressZero,
    WSTETH: ADDRESSES[Network.OPTIMISM].common.WSTETH,
    WBTC: ADDRESSES[Network.OPTIMISM].common.WBTC,
    USDC: ADDRESSES[Network.OPTIMISM].common.USDC,
    feeRecipient: ADDRESSES[Network.OPTIMISM].common.FeeRecipient,
    chainlinkEthUsdPriceFeed: ADDRESSES[Network.OPTIMISM].common.ChainlinkPriceOracle_ETHUSD,
    aaveOracle: ADDRESSES[Network.OPTIMISM].aave.v3.Oracle,
    pool: ADDRESSES[Network.OPTIMISM].aave.v3.LendingPool,
    poolDataProvider: ADDRESSES[Network.OPTIMISM].aave.v3.PoolDataProvider,
    priceOracle: ADDRESS_ZERO,
    lendingPool: ADDRESS_ZERO,
    protocolDataProvider: ADDRESS_ZERO,
    CBETH: ADDRESSES[Network.OPTIMISM].common.CBETH,
    RETH: ADDRESSES[Network.OPTIMISM].common.RETH,
  },
  [Network.ARBITRUM]: {
    DAI: ADDRESSES[Network.ARBITRUM].common.DAI,
    ETH: ADDRESSES[Network.ARBITRUM].common.ETH,
    WETH: ADDRESSES[Network.ARBITRUM].common.WETH,
    STETH: constants.AddressZero,
    WSTETH: ADDRESSES[Network.ARBITRUM].common.WSTETH,
    WBTC: ADDRESSES[Network.ARBITRUM].common.WBTC,
    USDC: ADDRESSES[Network.ARBITRUM].common.USDC,
    feeRecipient: ADDRESSES[Network.ARBITRUM].common.FeeRecipient,
    chainlinkEthUsdPriceFeed: ADDRESSES[Network.ARBITRUM].common.ChainlinkPriceOracle_ETHUSD,
    aaveOracle: ADDRESSES[Network.ARBITRUM].aave.v3.Oracle,
    pool: ADDRESSES[Network.ARBITRUM].aave.v3.LendingPool,
    poolDataProvider: ADDRESSES[Network.ARBITRUM].aave.v3.PoolDataProvider,
    priceOracle: ADDRESS_ZERO,
    lendingPool: ADDRESS_ZERO,
    protocolDataProvider: ADDRESS_ZERO,
    CBETH: ADDRESSES[Network.ARBITRUM].common.CBETH,
    RETH: ADDRESSES[Network.ARBITRUM].common.RETH,
  },
}

export type MainnetAddresses = (typeof testAddresses)[Network.MAINNET]
export type OptMainnetAddresses = (typeof testAddresses)[Network.OPTIMISM]
export type ArbMainnetAddresses = (typeof testAddresses)[Network.ARBITRUM]
export type NetworkAddressesForTests = MainnetAddresses | OptMainnetAddresses | ArbMainnetAddresses
