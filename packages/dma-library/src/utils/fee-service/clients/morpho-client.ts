import { Network } from '@deploy-configurations/types/network'
import type { GraphQLClient } from 'graphql-request'

import { getSdk } from '../generated/client-morpho'
import type { OasisPosition } from '../types'

export const getMorphoSubgraphNameByChainId = (network: Network): string => {
  const subgraphNameByChainMap: Partial<Record<Network, string>> = {
    [Network.MAINNET]: 'summer-morpho-blue',
    [Network.BASE]: 'summer-morpho-blue-base',
  }
  const subgraph = subgraphNameByChainMap[network]
  if (!subgraph) {
    throw new Error(`No subgraph for network ${network} on Ajna`)
  }
  return subgraph
}

export const getMorphoPosition = async (
  client: GraphQLClient,
  positionId: string,
): Promise<OasisPosition | undefined> => {
  const events = (await getSdk(client).GetPosition({ id: positionId })).borrowPosition?.oasisEvents
  return events ? { events } : undefined
}
