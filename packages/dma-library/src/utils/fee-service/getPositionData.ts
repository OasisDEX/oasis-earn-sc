import type { Network } from '@deploy-configurations/types/network'
import type { Address } from '@dma-common/types'
import type { AaveLikeProtocol } from '@dma-library/types/aave-like/aave-like-protocol-enum'

import type { getEarnMultiplyFee } from './getEarnMultiplyFee'
import { ProtocolId } from './ProtocolId'

export const getPositionDataAaveLike = (dependencies: {
  proxy: Address
  network: Network
  protocolType: AaveLikeProtocol
}): Parameters<typeof getEarnMultiplyFee>[0] => {
  return {
    network: dependencies.network,
    protocolId: ProtocolId[dependencies.protocolType],
    proxyAddress: dependencies.proxy,
  }
}

export const getPositionDataMorpho = (dependencies: {
  proxy: Address
  network: Network
}): Parameters<typeof getEarnMultiplyFee>[0] => {
  return {
    network: dependencies.network,
    protocolId: ProtocolId.MORPHO_BLUE,
    proxyAddress: dependencies.proxy,
  }
}

export const getPositionDataAjna = (dependencies: {
  proxy: Address
  network: Network
}): Parameters<typeof getEarnMultiplyFee>[0] => {
  return {
    network: dependencies.network,
    protocolId: ProtocolId.AJNA,
    proxyAddress: dependencies.proxy,
  }
}
