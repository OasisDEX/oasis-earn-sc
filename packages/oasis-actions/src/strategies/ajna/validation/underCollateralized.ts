import { AjnaPosition } from '../../../types/ajna'
import { AjnaError } from '../../../types/common'

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
