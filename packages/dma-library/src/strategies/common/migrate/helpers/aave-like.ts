import { ADDRESSES, SystemKeys } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { Tokens } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { MigrationArgs, PositionSource } from '@dma-library/strategies/aave-like'
import { AaveLikePosition } from '@dma-library/types'
import { WithMigrationStrategyDependencies } from '@dma-library/types/strategy-params'
import { ethers } from 'ethers'

/**
 * Retrieves the token symbol associated with the given address.
 *
 * @param address - The address of the token.
 * @param addresses - The addresses object containing token addresses for different networks.
 * @param network - The network for which to retrieve the token symbol.
 * @returns The token symbol associated with the given address.
 */
export function getTokenSymbolByAddress(address: Address, network: Network) {
  const addresses = getAddresses(network)
  const tokenSymbol = Object.keys(addresses.common).find(
    symbol => addresses.common[symbol] === address,
  )
  return tokenSymbol
}
/**
 * Retrieves the token information by symbol.
 *
 * @param symbol - The symbol of the token.
 * @param addresses - The addresses object containing token addresses for different networks.
 * @param network - The network identifier.
 * @returns An object containing the symbol and address of the token.
 */
export function getTokenBySymbol(symbol: Tokens, network: Network) {
  const addresses = getAddresses(network)
  const tokenAddress = addresses.common[symbol]
  return {
    symbol: symbol,
    address: tokenAddress,
  }
}
/**
 * Retrieves the addresses based on the specified network.
 * @param network The network for which to retrieve the addresses.
 * @returns The addresses corresponding to the specified network.
 * @throws Error if the network is not supported.
 */
export function getAddresses(network: Network) {
  const { mainnet, base, optimism, arbitrum } = ADDRESSES
  switch (network) {
    case Network.MAINNET:
      return mainnet
    case Network.BASE:
      return base
    case Network.OPTIMISM:
      return optimism
    case Network.ARBITRUM:
      return arbitrum
    default:
      throw new Error('Unsupported network')
  }
}
/**
 * Retrieves Aave-like strategy addresses based on the provided network.
 * @param network The network to retrieve addresses for.
 * @returns An object containing the Aave-like strategy addresses.
 */
export function getAaveLikeAddresses(
  network: Network,
  protocol: SystemKeys,
): AaveLikeStrategyAddresses {
  const addresses = getAddresses(network)
  switch (protocol) {
    case SystemKeys.AAVE:
      return {
        tokens: {
          ...addresses[SystemKeys.COMMON],
        },
        operationExecutor: addresses[SystemKeys.MPA]['core'].OperationExecutor,
        oracle: addresses[SystemKeys.AAVE]['v3'].Oracle,
        lendingPool: addresses[SystemKeys.AAVE]['v3'].LendingPool,
        poolDataProvider: addresses[SystemKeys.AAVE]['v3'].PoolDataProvider,
        chainlinkEthUsdPriceFeed: addresses[SystemKeys.COMMON].ChainlinkPriceOracle_ETHUSD,
      }
    case SystemKeys.SPARK:
      return {
        tokens: {
          ...addresses[SystemKeys.COMMON],
        },
        operationExecutor: addresses[SystemKeys.MPA]['core'].OperationExecutor,
        oracle: addresses[SystemKeys.SPARK].Oracle ? addresses[SystemKeys.SPARK].Oracle : '',
        lendingPool: addresses[SystemKeys.SPARK].LendingPool
          ? addresses[SystemKeys.SPARK].LendingPool
          : '',
        poolDataProvider: addresses[SystemKeys.SPARK].PoolDataProvider
          ? addresses[SystemKeys.SPARK].PoolDataProvider
          : '',
        chainlinkEthUsdPriceFeed: addresses[SystemKeys.COMMON].ChainlinkPriceOracle_ETHUSD,
      }
    default:
      throw new Error('Unsupported protocol')
  }
}

export function getAaveLikeApprovalTx(
  args: MigrationArgs,
  currentPosition: AaveLikePosition,
  aTokenaddress: string,
  dependencies: WithMigrationStrategyDependencies,
) {
  switch (args.positionSource) {
    case PositionSource.DS_PROXY: {
      const ABI = ['function approve(address _token,address _spender, uint _value)']
      const IERC20 = new ethers.utils.Interface(ABI)
      const approvalData = IERC20.encodeFunctionData('approve', [
        aTokenaddress,
        dependencies.proxy,
        currentPosition.collateral.amount.times(1.01).toFixed(0), // approve 1% more to accoutn for interest accrual
      ])
      const proxyABI = ['function execute(address _target, bytes memory _data)']
      const IProxy = new ethers.utils.Interface(proxyABI)
      const encodedData = IProxy.encodeFunctionData('execute', [
        dependencies.erc20ProxyActions,
        approvalData,
      ])
      return {
        to: args.sourceAddress,
        data: encodedData,
        value: '0',
      }
    }
    case PositionSource.EOA: {
      const ABI = ['function approve(address _spender, uint _value)']
      const iface = new ethers.utils.Interface(ABI)
      const approvalData = iface.encodeFunctionData('approve', [
        dependencies.proxy,
        currentPosition.collateral.amount.times(1.01).toFixed(0), // approve 1% more to accoutn for interest accrual
      ])
      return {
        to: aTokenaddress,
        data: approvalData,
        value: '0',
      }
    }
    default:
      throw new Error('Unsupported position source')
  }
}
