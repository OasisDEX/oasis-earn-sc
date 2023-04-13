import BigNumber from 'bignumber.js'

import { DEFAULT_FEE, FEE_BASE } from '../../constants'

export function calculateFee(amountWei: BigNumber, fee: number = DEFAULT_FEE): BigNumber {
  return amountWei.times(new BigNumber(fee).div(FEE_BASE)).integerValue(BigNumber.ROUND_DOWN)
}
