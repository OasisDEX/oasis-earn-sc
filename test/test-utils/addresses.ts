import { Network } from '@helpers/network'
import { ADDRESSES } from '@oasisdex/oasis-actions/src/helpers/addresses'

/**
 * Flatten a multidimensional object
 *
 * For example:
 *   flattenObject{ a: 1, b: { c: 2 } }
 * Returns:
 *   { a: 1, c: 2}
 */
export const flattenObject = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const flattened: Record<string, any> = {}

  Object.keys(obj).forEach(key => {
    const value = obj[key]

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value))
    } else {
      flattened[key] = value
    }
  })

  return flattened
}

export function addressesByNetwork(network: Network.MAINNET): MainnetAddresses
export function addressesByNetwork(network: Network.OPT_MAINNET): OptMainnetAddresses
export function addressesByNetwork(network: Network): NetworkAddressesForTests {
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
    aave: {
      v3: {
        aaveOracle: ADDRESSES.optimism.aave.v3.AaveOracle,
        pool: ADDRESSES.optimism.aave.v3.Pool,
        poolDataProvider: ADDRESSES.optimism.aave.v3.PoolDataProvider,
      },
    },
  },
}

const mainnetAddressesForTests = {
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

type MainnetAddresses = typeof testAddresses[Network.MAINNET]
type OptMainnetAddresses = typeof testAddresses[Network.OPT_MAINNET]
type NetworkAddressesForTests = MainnetAddresses | OptMainnetAddresses
