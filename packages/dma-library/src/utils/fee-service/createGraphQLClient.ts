import { Network } from '@deploy-configurations/types/network'
import { GraphQLClient } from 'graphql-request'

import { getAaveLikePosition, getAaveLikeSubgraphNameByChainId } from './clients/aave-like-client'
import { getAjnaPosition, getAjnaSubgraphNameByChainId } from './clients/ajna-v2-client'
import { getMorphoPosition, getMorphoSubgraphNameByChainId } from './clients/morpho-client'
import type { IFeeManagerClient } from './interfaces'
import { ProtocolId } from './ProtocolId'

const getSubgraphName = (network: Network, protocolId: ProtocolId): string => {
  switch (protocolId) {
    case ProtocolId.AAVE:
    case ProtocolId.AAVE_V3:
    case ProtocolId.Spark:
      return getAaveLikeSubgraphNameByChainId(network)
    case ProtocolId.AJNA:
      return getAjnaSubgraphNameByChainId(network)
    case ProtocolId.MORPHO_BLUE:
      return getMorphoSubgraphNameByChainId(network)
    default:
      throw new Error(`No subgraph assigned to Protocol ID ${protocolId}`)
  }
}

const validateChainId = (network: Network): void => {
  const supportedNetworks = [Network.MAINNET, Network.ARBITRUM, Network.BASE, Network.OPTIMISM]
  if (!supportedNetworks.includes(network)) {
    throw new Error(
      `Chain ID ${network} is not supported. Supported chains are: ${supportedNetworks.join(', ')}`,
    )
  }
}

const validateProtocolId = (protocolId: ProtocolId): void => {
  const supportedProtocols = [
    ProtocolId.AAVE,
    ProtocolId.AAVE_V3,
    ProtocolId.Spark,
    ProtocolId.AJNA,
    ProtocolId.MORPHO_BLUE,
  ]
  if (!supportedProtocols.includes(protocolId)) {
    throw new Error(
      `Protocol ID ${protocolId} is not supported. Supported protocols are: ${supportedProtocols.join(
        ', ',
      )}`,
    )
  }
}

export const createGraphQLClient = (
  network: Network,
  protocolId: ProtocolId,
  baseUrl: string,
): IFeeManagerClient => {
  validateChainId(network)
  validateProtocolId(protocolId)
  const subgraphName = getSubgraphName(network, protocolId)
  const url = `${baseUrl}/${subgraphName}`
  const client = new GraphQLClient(url)

  const GetPosition = async ({
    marketId,
    proxyAddress,
  }: {
    proxyAddress: string
    marketId?: string
  }) => {
    switch (protocolId) {
      case ProtocolId.AAVE:
      case ProtocolId.AAVE_V3:
      case ProtocolId.Spark:
        return getAaveLikePosition(client, `${proxyAddress}-${protocolId}`)
      case ProtocolId.AJNA:
        return getAjnaPosition(client, proxyAddress)
      case ProtocolId.MORPHO_BLUE:
        if (!marketId) {
          throw new Error('Market ID is required for Morpho')
        }
        return getMorphoPosition(client, `${marketId}-${proxyAddress}`)
      default:
        throw new Error(`No subgraph assigned to Protocol ID ${protocolId}`)
    }
  }

  return {
    GetPosition,
  }
}
