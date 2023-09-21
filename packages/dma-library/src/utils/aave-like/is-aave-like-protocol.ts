import { AaveLikeProtocol } from '@dma-library/types/protocol'

export const isAaveLikeProtocol = (protocol: AaveLikeProtocol): boolean => {
  switch (protocol) {
    case 'AAVE':
    case 'AAVE_V3':
    case 'Spark':
      return true
    default:
      throw new Error(`Unknown protocol: ${protocol}`)
  }
}
