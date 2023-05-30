import { Tx } from '@dma-common/types'
import { AjnaError, AjnaNotice, AjnaSuccess, AjnaWarning } from '@dma-library/types/ajna'

export type Strategy<Position> = {
  simulation: {
    swaps: []
    // @deprecated - use position
    targetPosition: Position
    position: Position
    errors: AjnaError[]
    warnings: AjnaWarning[]
    notices: AjnaNotice[]
    successes: AjnaSuccess[]
  }
  tx: Tx
}
