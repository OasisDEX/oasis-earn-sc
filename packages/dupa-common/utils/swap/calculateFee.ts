import BigNumber from 'bignumber.js'

import { FEE, FEE_BASE } from '../../../dupa-library/test/common/Swap.test'

export function calculateFee(amountWei: BigNumber, fee: number = FEE): BigNumber {
  return amountWei.times(new BigNumber(fee).div(FEE_BASE)).integerValue(BigNumber.ROUND_DOWN)
}
