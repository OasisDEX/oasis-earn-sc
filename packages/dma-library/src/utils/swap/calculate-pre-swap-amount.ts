import BigNumber from 'bignumber.js'

import { DEFAULT_FEE, FEE_BASE, ZERO } from '@oasisdex/dma-common/constants'
import { calculateFee } from '../index'

export function calculatePreSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken' | undefined,
  swapAmountBeforeFees: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
) {
  return collectFeeFrom === 'sourceToken'
    ? calculateFee(swapAmountBeforeFees, fee, new BigNumber(FEE_BASE))
    : ZERO
}
