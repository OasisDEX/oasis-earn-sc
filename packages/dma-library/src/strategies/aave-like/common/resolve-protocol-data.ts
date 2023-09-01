import {
  isAaveProtocol,
  resolveAavelikeProtocol,
} from '@dma-library/protocols/aave-like/resolve-aavelike-protocols'
import { SharedAaveLikeProtocolDataArgs } from '@dma-library/protocols/aave-like/types'
import { AaveLikeProtocol } from '@dma-library/types/protocol'

export async function resolveProtocolData(
  args: SharedAaveLikeProtocolDataArgs,
  protocolType: AaveLikeProtocol,
) {
  const { protocol, version } = resolveAavelikeProtocol(protocolType)

  if (isAaveProtocol(protocol)) {
    if (!version) throw new Error('Version must be defined when using Aave view')
    return await protocol[version](args)
  }
  return await protocol(args)
}
