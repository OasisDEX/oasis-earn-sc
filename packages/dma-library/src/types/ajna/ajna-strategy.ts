import { Strategy } from '@dma-library/types'
import { AjnaError, AjnaNotice, AjnaSuccess, AjnaWarning } from '@dma-library/types/ajna'

export type SummerStrategy<Position> = Strategy<Position> & {
  simulation: Strategy<Position>['simulation'] & {
    errors: AjnaError[]
    warnings: AjnaWarning[]
    notices: AjnaNotice[]
    successes: AjnaSuccess[]
  }
}
