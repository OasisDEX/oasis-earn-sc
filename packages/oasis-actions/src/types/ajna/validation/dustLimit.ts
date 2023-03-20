import { AjnaError } from '../../common'
import { AjnaPosition } from '../AjnaPosition'

export function validateDustLimit(position: AjnaPosition): AjnaError[] {
  if (position.debtAmount.gte(position.pool.poolMinDebtAmount)) {
    return [
      {
        name: 'debt-less-then-dust-limit',
      },
    ]
  } else {
    return []
  }
}
