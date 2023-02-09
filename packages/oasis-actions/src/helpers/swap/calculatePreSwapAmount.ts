import BigNumber from 'bignumber.js'

import { DEFAULT_FEE, FEE_BASE, ZERO } from '../constants'
import { calculateFee } from '../index'

export function calculatePreSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken' | undefined,
  swapAmountBeforeFees: BigNumber,
) {
  return collectFeeFrom === 'sourceToken'
    ? calculateFee(swapAmountBeforeFees, new BigNumber(DEFAULT_FEE), new BigNumber(FEE_BASE))
    : ZERO
}
