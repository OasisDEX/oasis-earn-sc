import { AaveLikeProtocol } from '@dma-library/types/protocol'

type ProtocolKeyConfig = {
  protocol: 'aave' | 'spark'
  version?: 'v2' | 'v3'
}

export const resolveProtocolKeyConfig = (protocol: AaveLikeProtocol): ProtocolKeyConfig => {
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
