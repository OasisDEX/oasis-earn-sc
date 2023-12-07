import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { AjnaError } from '@dma-library/types/ajna'
import { LendingPosition } from '@dma-library/types/morphoblue/morphoblue-position'
import BigNumber from 'bignumber.js'

export function validateOverRepay(
  positionBefore: LendingPosition,
  repayAmount: BigNumber,
): AjnaError[] {
  if (repayAmount.gt(positionBefore.debtAmount)) {
    return [
      {
        name: 'payback-amount-exceeds-debt-token-balance',
        data: {
          amount: formatCryptoBalance(positionBefore.debtAmount),
        },
      },
    ]
  } else {
    return []
  }
}
