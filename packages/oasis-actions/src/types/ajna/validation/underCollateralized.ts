import { AjnaError } from '../../common'
import { AjnaPosition } from '../AjnaPosition'

export function validateUndercollateralized(position: AjnaPosition): AjnaError[] {
  if (position.thresholdPrice.gt(position.pool.lowestUtilizedPrice)) {
    return [
      {
        name: 'undercollateralized',
        data: {
          minRatio: '',
          positionRatio: '',
        },
      },
    ]
  }
  return []
}
