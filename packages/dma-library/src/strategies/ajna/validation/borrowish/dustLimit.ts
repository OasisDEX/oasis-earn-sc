import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { shouldDisplayAjnaDustLimitValidation } from '@dma-library/protocols/ajna'
import { AjnaError, AjnaPosition } from '@dma-library/types/ajna'

export function validateDustLimit(position: AjnaPosition): AjnaError[] {
  if (shouldDisplayAjnaDustLimitValidation(position)) {
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
