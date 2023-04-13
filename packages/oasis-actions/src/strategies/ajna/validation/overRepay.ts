import BigNumber from 'bignumber.js'

import { AjnaPosition } from '../../../types/ajna'
import { AjnaError } from '../../../types/common'

export function validateOverRepay(
  positionBefore: AjnaPosition,
  repayAmount: BigNumber,
): AjnaError[] {
  if (repayAmount.gt(positionBefore.debtAmount)) {
    return [
      {
        name: 'payback-amount-exceeds-debt-token-balance',
        data: {
          amount: positionBefore.debtAmount.decimalPlaces(2).toString(),
        },
      },
    ]
  } else {
    return []
  }
}
