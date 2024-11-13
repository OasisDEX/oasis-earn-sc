import type { Network } from '@deploy-configurations/types/network'

import { calculateFee } from './calculateFee'
import { createGraphQLClient } from './createGraphQLClient'
import { ProtocolId } from './ProtocolId'
import type { OasisPosition } from './types'

export const getEarnMultiplyFee = async ({
  network: network,
  protocolId,
  proxyAddress,
  params,
}: {
  network: Network
  protocolId: ProtocolId
  proxyAddress: string
  params?: { marketId?: string }
}) => {
  //set envs
  const { SUBGRAPH_BASE: subgraphBase = process.env.SUBGRAPH_BASE } = process.env || {}

  if (!subgraphBase) {
    throw new Error('Missing subgraphBase env in the running env')
  }

  let position: OasisPosition | undefined
  try {
    const subgraphClient = createGraphQLClient(network, protocolId, subgraphBase)
    position = await subgraphClient.GetPosition({ proxyAddress, marketId: params?.marketId })
  } catch (error) {
    console.error(error)
  }

  if (!position) {
    throw Error(
      `Position with proxyAddress (${proxyAddress}) and protocol ${protocolId} not found in the graph, probably an empty proxy or your position is on a fork :)`,
    )
  }

  const fee = calculateFee(position)
  return fee
}
