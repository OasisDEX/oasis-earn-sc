import { Tx } from '@dma-common/types'
import { AjnaError, AjnaWarning } from '@dma-library/types/ajna'

export type Strategy<Position> = {
  simulation: {
    swaps: []
    // @deprecated - use position
    targetPosition: Position
    position: Position
    errors: AjnaError[]
    warnings: AjnaWarning[]
  }
  tx: Tx
}
