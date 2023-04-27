import BigNumber from 'bignumber.js'

import { formatCryptoBalance } from '../../../helpers/formatCryptoBalance'
import { AjnaPosition } from '../../../types/ajna'
import { AjnaError } from '../../../types/common'

export function validateOverWithdraw(
  position: AjnaPosition,
  positionBefore: AjnaPosition,
  withdrawAmount: BigNumber,
): AjnaError[] {
  const withdrawMax = positionBefore.collateralAmount.minus(
    position.debtAmount.div(position.pool.lowestUtilizedPrice),
  )
  if (withdrawAmount.gt(withdrawMax)) {
    return [
      {
        name: 'withdraw-more-than-available',
        data: {
          amount: formatCryptoBalance(withdrawMax),
        },
      },
    ]
  } else {
    return []
  }
}
