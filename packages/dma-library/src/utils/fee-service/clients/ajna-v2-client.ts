import { Network } from '@deploy-configurations/types/network'
import type { GraphQLClient } from 'graphql-request'

import { getSdk } from '../generated/client-ajna-v2'
import type { OasisPosition } from '../types'

export const getAjnaSubgraphNameByChainId = (network: Network): string => {
  const subgraphNameByChainMap: Partial<Record<Network, string>> = {
    [Network.MAINNET]: 'summer-ajna-v2',
    [Network.BASE]: 'summer-ajna-v2-base',
  }
  const subgraph = subgraphNameByChainMap[network]
  if (!subgraph) {
    throw new Error(`No subgraph for network ${network} on Ajna`)
  }
  return subgraph
}

export const getAjnaPosition = async (
  client: GraphQLClient,
  positionId: string,
): Promise<OasisPosition | undefined> => {
  const events = (await getSdk(client).GetPosition({ id: positionId })).earnPosition?.oasisEvents
  return events ? { events } : undefined
}
