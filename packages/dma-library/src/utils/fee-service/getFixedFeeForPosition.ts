import type { Network } from '@deploy-configurations/types/network'

import { calculateFee } from './calculateFee'
import { createGraphQLClient } from './createGraphQLClient'
import { ProtocolId } from './ProtocolId'
import type { OasisPosition } from './types'

export type FixedFeePositionData = {
  network: Network
  protocolId: ProtocolId
  proxyAddress: string
  params?: {
    marketId?: string
  }
}

export const getFixedFeeForPosition = async ({
  network: network,
  protocolId,
  proxyAddress,
  params,
}: FixedFeePositionData) => {
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
    console.error(
      `Position with proxyAddress (${proxyAddress}) ${
        params?.marketId ? 'and marketId (' + params.marketId + ')' : ''
      }) and protocol ${protocolId} not found in the graph, probably an empty proxy or your position is on a fork so fee is set to zero.`,
    )
    return '0'
  }

  const fee = calculateFee(position)
  return fee
}
