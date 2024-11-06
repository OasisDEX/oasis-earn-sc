import type { Network } from '@deploy-configurations/types/network'

import { calculateFee } from './calculateFee'
import { createGraphQLClient } from './createGraphQLClient'
import { ProtocolId } from './ProtocolId'
import type { OasisPosition } from './types'

export const getEarnMultiplyFee = async ({
  network: network,
  protocolId,
  proxyAddress,
}: {
  network: Network
  protocolId: ProtocolId
  proxyAddress: string
}) => {
  //set envs
  const { SUBGRAPH_BASE: subgraphBase = process.env.SUBGRAPH_BASE } = process.env || {}

  if (!subgraphBase) {
    throw new Error('Missing subgraphBase env in the running env')
  }

  let position: OasisPosition | undefined
  try {
    const subgraphClient = createGraphQLClient(network, protocolId, subgraphBase)
    position = await subgraphClient.GetPosition(proxyAddress)
  } catch (error) {
    throw new Error(
      `Error fetching position for getEarnMultiplyFee with proxyAddress (${proxyAddress}) and protocol ${protocolId}.`,
    )
  }

  if (!position) {
    throw Error(`Position with proxyAddress (${proxyAddress}) and protocol ${protocolId} not found`)
  }

  const fee = calculateFee(position)
  return fee
}
