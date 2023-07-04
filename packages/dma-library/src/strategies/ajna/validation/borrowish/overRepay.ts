import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { AjnaError, AjnaPosition } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export function validateOverRepay(
  positionBefore: AjnaPosition,
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
