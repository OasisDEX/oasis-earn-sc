import { formatCryptoBalance } from '@dma-common/utils/common/formaters'

import { AjnaPosition } from '../../../types/ajna'
import { AjnaError } from '../../../types/common'

export function validateDustLimit(position: AjnaPosition): AjnaError[] {
  if (position.debtAmount.lt(position.pool.poolMinDebtAmount) && position.debtAmount.gt(0)) {
    return [
      {
        name: 'debt-less-then-dust-limit',
        data: {
          minDebtAmount: formatCryptoBalance(position.pool.poolMinDebtAmount),
        },
      },
    ]
  } else {
    return []
  }
}
