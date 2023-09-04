import { AaveLikePosition } from '@dma-library/types/aave-like'

export function assertPosition(currentPosition: AaveLikePosition | undefined): void {
  if (!currentPosition) {
    throw new Error('Could not get current position')
  }
}
