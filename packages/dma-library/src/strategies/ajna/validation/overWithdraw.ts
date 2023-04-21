import BigNumber from 'bignumber.js'

import { AjnaPosition } from '../../../types/ajna'
import { AjnaError } from '../../../types/common'

export function validateOverWithdraw(
  positionBefore: AjnaPosition,
  withdrawAmount: BigNumber,
): AjnaError[] {
  if (withdrawAmount.gt(positionBefore.collateralAvailable)) {
    return [
      {
        name: 'withdraw-more-than-available',
        data: {
          amount: positionBefore.collateralAvailable.decimalPlaces(2).toString(),
        },
      },
    ]
  } else {
    return []
  }
}
