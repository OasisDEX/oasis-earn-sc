import { shouldDisplayAjnaDustLimitValidation } from '@dma-library/protocols/ajna'
import { AjnaError, AjnaPosition } from '@dma-library/types/ajna'

export function validateDustLimitMultiply(position: AjnaPosition): AjnaError[] {
  if (shouldDisplayAjnaDustLimitValidation(position)) {
    return [
      {
        name: 'debt-less-then-dust-limit-multiply',
      },
    ]
  } else {
    return []
  }
}
