import { AaveLikeProtocol, AaveLikeProtocolEnum } from '@dma-library/types/protocol'

export const isAaveLikeProtocol = (protocol: AaveLikeProtocol): boolean => {
  return Object.values(AaveLikeProtocolEnum).includes(protocol as AaveLikeProtocolEnum)
}
