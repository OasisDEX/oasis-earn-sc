import { AaveLikeProtocolData } from '@dma-library/protocols/aave-like'

export function assertProtocolData(protocolData: AaveLikeProtocolData | undefined): void {
  if (!protocolData) {
    throw new Error('Could not get protocol data')
  }
}
