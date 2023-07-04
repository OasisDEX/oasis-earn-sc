import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { AjnaError, AjnaPosition } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

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
