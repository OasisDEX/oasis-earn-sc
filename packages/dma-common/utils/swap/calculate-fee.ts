import { DEFAULT_FEE, FEE_BASE } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

export function calculatePercentageFee(
  amountWei: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
): BigNumber {
  return amountWei
    .times(fee)
    .div(fee.plus(new BigNumber(FEE_BASE)))
    .abs()
    .integerValue(BigNumber.ROUND_DOWN)
}

export function calculatePercentageFeeOnInputAmount(
  amountWei: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
): BigNumber {
  return amountWei.times(fee).div(new BigNumber(FEE_BASE)).abs().integerValue(BigNumber.ROUND_UP)
}
