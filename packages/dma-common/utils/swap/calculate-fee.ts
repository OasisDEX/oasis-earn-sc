import { DEFAULT_FEE, FEE_BASE } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

export function calculateFee(amountWei: BigNumber, fee: number = DEFAULT_FEE): BigNumber {
  return amountWei
    .times(fee)
    .div(new BigNumber(fee).plus(new BigNumber(FEE_BASE)))
    .abs()
    .integerValue(BigNumber.ROUND_DOWN)
}

export function calculateFeeOnInputAmount(
  amountWei: BigNumber,
  fee: number = DEFAULT_FEE,
): BigNumber {
  return amountWei.times(fee).div(new BigNumber(FEE_BASE)).abs().integerValue(BigNumber.ROUND_UP)
}
