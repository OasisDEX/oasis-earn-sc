import { DecodersMap } from './types'

/**
 * @notice Safe API endpoints for each network
 */
export const SafeApiEndpoints: { [network: string]: string } = {
  arbitrum: 'https://safe-transaction-arbitrum.safe.global/',
  aurora: 'https://safe-transaction-aurora.safe.global/',
  avalanche: 'https://safe-transaction-avalanche.safe.global/',
  base: 'https://safe-transaction-base.safe.global/',
  celo: 'https://safe-transaction-celo.safe.global/',
  mainnet: 'https://safe-transaction-mainnet.safe.global/',
  optimism: 'https://safe-transaction-optimism.safe.global/',
  polygon: 'https://safe-transaction-polygon.safe.global/',
}

/**
 * @notice Supported decoders and methods for each contract
 */
export const SupportedTxDecoders: DecodersMap = {}
