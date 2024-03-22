import { Strategy } from '@dma-library/types'
import { AjnaError, AjnaNotice, AjnaSuccess, AjnaWarning } from '@dma-library/types/ajna'

import { Erc4626StrategyError } from '../common/erc4626-validation'

export type SummerStrategy<Position> = Strategy<Position> & {
  simulation: Strategy<Position>['simulation'] & {
    errors: AjnaError[] | Erc4626StrategyError[]
    warnings: AjnaWarning[]
    notices: AjnaNotice[]
    successes: AjnaSuccess[]
  }
}
