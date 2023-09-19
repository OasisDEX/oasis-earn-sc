import { formatCryptoBalance } from '@dma-common/utils/common'
import { AjnaEarnPosition, AjnaError } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export const validateWithdrawMoreThanAvailable = (
  position: AjnaEarnPosition,
  quoteAmount: BigNumber,
  quoteTokenPrecision: number,
): AjnaError[] => {
  if (position.quoteTokenAmount.decimalPlaces(quoteTokenPrecision).lt(quoteAmount)) {
    return [
      {
        name: 'withdraw-more-than-available',
        data: {
          amount: formatCryptoBalance(position.quoteTokenAmount),
        },
      },
    ]
  } else {
    return []
  }
}
