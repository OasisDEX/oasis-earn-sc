import { Network } from '@helpers/network'
import { ADDRESSES } from '@oasisdex/oasis-actions/src/helpers/addresses'

import { EMPTY_ADDRESS } from '../constants'

// Type guards
export function isMainnetByNetwork(network: Network): network is Network.MAINNET {
  return network === Network.MAINNET
}
export function isOptimismByNetwork(network: Network): network is Network.OPTIMISM {
  return network === Network.OPTIMISM
}

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
    default:
      throw new Error(`Network ${network} not supported`)
  }
}

// These addresses are used to map the addresses in the library
// Into a form expected by our tests
// TODO: Use addresses from our deploy system should be the source of truth for Addresses
export const testAddresses = {
  [Network.MAINNET]: {
    DAI: ADDRESSES.main.DAI,
    ETH: ADDRESSES.main.ETH,
    WETH: ADDRESSES.main.WETH,
    STETH: ADDRESSES.main.STETH,
    WSTETH: ADDRESSES.main.WSTETH,
    WBTC: ADDRESSES.main.WBTC,
    USDC: ADDRESSES.main.USDC,
    feeRecipient: ADDRESSES.main.feeRecipient,
    chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
    priceOracle: ADDRESSES.main.aave.v2.PriceOracle,
    lendingPool: ADDRESSES.main.aave.v2.LendingPool,
    protocolDataProvider: ADDRESSES.main.aave.v2.ProtocolDataProvider,
    aaveOracle: ADDRESSES.main.aave.v3.AaveOracle,
    pool: ADDRESSES.main.aave.v3.Pool,
    poolDataProvider: ADDRESSES.main.aave.v3.PoolDataProvider,
  },
  [Network.OPTIMISM]: {
    DAI: ADDRESSES.optimism.DAI,
    ETH: ADDRESSES.optimism.ETH,
    WETH: ADDRESSES.optimism.WETH,
    STETH: EMPTY_ADDRESS,
    WSTETH: ADDRESSES.optimism.WSTETH,
    WBTC: ADDRESSES.optimism.WBTC,
    USDC: ADDRESSES.optimism.USDC,
    feeRecipient: ADDRESSES.optimism.feeRecipient,
    chainlinkEthUsdPriceFeed: ADDRESSES.optimism.chainlinkEthUsdPriceFeed,
    aaveOracle: ADDRESSES.optimism.aave.v3.AaveOracle,
    pool: ADDRESSES.optimism.aave.v3.Pool,
    poolDataProvider: ADDRESSES.optimism.aave.v3.PoolDataProvider,
  },
}

export type MainnetAddresses = typeof testAddresses[Network.MAINNET]
export type OptMainnetAddresses = typeof testAddresses[Network.OPTIMISM]
export type NetworkAddressesForTests = MainnetAddresses | OptMainnetAddresses
