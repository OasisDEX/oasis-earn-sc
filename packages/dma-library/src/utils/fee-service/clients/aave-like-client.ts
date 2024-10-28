import { Network } from '@deploy-configurations/types/network'
import type { GraphQLClient } from 'graphql-request'

import { getSdk } from '../generated/client-aave-like'
import type { OasisPosition } from '../types'

export const getAaveLikeSubgraphNameByChainId = (network: Network): string => {
  const subgraphNameByChainMap: Partial<Record<Network, string>> = {
    [Network.MAINNET]: 'summer-oasis-history',
    [Network.ARBITRUM]: 'summer-oasis-history-arbitrum',
    [Network.BASE]: 'summer-oasis-history-base',
    [Network.OPTIMISM]: 'summer-oasis-history-optimism',
  }
  const subgraph = subgraphNameByChainMap[network]
  if (!subgraph) {
    throw new Error(`No subgraph for network ${network} on Aave-like`)
  }
  return subgraph
}

export const getAaveLikePosition = async (
  client: GraphQLClient,
  positionId: string,
): Promise<OasisPosition | undefined> => {
  const events = (await getSdk(client).GetPosition({ id: positionId })).position?.events
  return events ? { events } : undefined
}
