import { AjnaError } from '../../common'
import { AjnaPosition } from '../AjnaPosition'

export function validateDustLimit(position: AjnaPosition): AjnaError[] {
  if (position.pool.loansCount.gt(9) && position.debtAmount.lt(position.pool.poolMinDebtAmount)) {
    return [
      {
        name: 'debt-less-then-dust-limit',
      },
    ]
  } else {
    return []
  }
}
