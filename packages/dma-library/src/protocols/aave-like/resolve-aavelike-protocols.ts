import { protocols } from '@dma-library/protocols'
import { AaveProtocol } from '@dma-library/protocols/aave'
import { SparkProtocol } from '@dma-library/protocols/spark'
import { AaveLikeProtocol } from '@dma-library/types/protocol'

type ProtocolKeyConfig = {
  protocol: 'aave' | 'spark'
  version?: 'v2' | 'v3'
}

const resolveProtocolKeyConfig = (protocol: AaveLikeProtocol): ProtocolKeyConfig => {
  switch (protocol) {
    case 'AAVE':
      return {
        protocol: 'aave',
        version: 'v2',
      }
    case 'AAVE_V3':
      return {
        protocol: 'aave',
        version: 'v3',
      }
    case 'Spark':
      return {
        protocol: 'spark',
      }
  }
}

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
