import { AjnaPosition } from '../../../types/ajna'
import { AjnaError } from '../../../types/common'

export function validateDustLimit(position: AjnaPosition): AjnaError[] {
  if (position.debtAmount.lt(position.pool.poolMinDebtAmount)) {
    return [
      {
        name: 'debt-less-then-dust-limit',
      },
    ]
  } else {
    return []
  }
}
