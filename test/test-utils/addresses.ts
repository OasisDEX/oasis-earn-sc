import { Network } from '@helpers/network'
import { ADDRESSES } from '@oasisdex/oasis-actions/src/helpers/addresses'

// Type guards
// export function isMainnetAddresses(
//   addresses: NetworkAddressesForTests,
// ): addresses is MainnetAddresses
// export function isMainnetAddresses(
//   addresses: NetworkAddressesForTests,
// ): addresses is OptMainnetAddresses
//
// export function isMainnetByTestAddresses(
//   addresses: NetworkAddressesForTests,
// ): addresses is MainnetAddresses {
//   return !!(addresses as MainnetAddresses).lendingPool
// }
//
// export function isOptimismByTestAddresses(
//   addresses: NetworkAddressesForTests,
// ): addresses is OptMainnetAddresses {
//   return (addresses as any)['lendingPool'] === undefined
// }

export function isMainnetByNetwork(network: Network): network is Network.MAINNET {
  return network === Network.MAINNET
}
export function isOptimismByNetwork(network: Network): network is Network.OPT_MAINNET {
  return network === Network.OPT_MAINNET
}

export function addressesByNetwork(network: Network.MAINNET): MainnetAddresses
export function addressesByNetwork(network: Network.OPT_MAINNET): OptMainnetAddresses
export function addressesByNetwork(
  network: Network.MAINNET | Network.OPT_MAINNET,
): NetworkAddressesForTests | undefined {
  switch (network) {
    case Network.MAINNET:
      return testAddresses[Network.MAINNET]
    case Network.OPT_MAINNET:
      return testAddresses[Network.OPT_MAINNET]
    default:
      throw new Error(`Network ${network} not supported`)
  }
}

// These addresses are used to map the addresses in the library
// Into a form expected by our tests
// TODO: Use addresses from our deploy system should be the source of truth for Addresses
const testAddresses = {
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
  [Network.OPT_MAINNET]: {
    DAI: ADDRESSES.optimism.DAI,
    ETH: ADDRESSES.optimism.ETH,
    WETH: ADDRESSES.optimism.WETH,
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
export type OptMainnetAddresses = typeof testAddresses[Network.OPT_MAINNET]
export type NetworkAddressesForTests = MainnetAddresses | OptMainnetAddresses

// function omitV2AddressesOnMainnet(
//   addresses: MainnetAddresses & { operationExecutor: string },
// ): AAVEV3StrategyAddresses {
//   const { lendingPool, priceOracle, protocolDataProvider, ...rest } = addresses
//   return rest
// }
//
// function omitV3AddressesOnMainnet(
//   addresses: MainnetAddresses & { operationExecutor: string },
// ): AAVEStrategyAddresses {
//   const { aaveOracle, pool, poolDataProvider, ...rest } = addresses
//   return rest
// }
