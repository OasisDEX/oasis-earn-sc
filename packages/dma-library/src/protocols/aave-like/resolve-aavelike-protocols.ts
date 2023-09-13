import { protocols } from '@dma-library/protocols'
import { AaveProtocol } from '@dma-library/protocols/aave'
import { SparkProtocol } from '@dma-library/protocols/spark'
import { AaveLikeProtocol } from '@dma-library/types/protocol'
import { resolveProtocolKeyConfig } from '@dma-library/utils/aave-like'

export function isAaveProtocol(protocol: AaveProtocol | SparkProtocol): protocol is AaveProtocol {
  return protocol && ('v2' in protocol || 'v3' in protocol)
}

export function resolveAavelikeProtocol(protocolType: AaveLikeProtocol) {
  const { protocol, version } = resolveProtocolKeyConfig(protocolType)

  if (protocol === 'aave' && !version) {
    throw new Error('Must specify version for Aave protocol')
  }

  const protocolDataGetter = protocols[protocol]
  return { protocol: protocolDataGetter, version }
}
