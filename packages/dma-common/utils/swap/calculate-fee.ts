import { DEFAULT_FEE, FEE_BASE } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

export function calculatePercentageFee(amountWei: BigNumber, fee: number = DEFAULT_FEE): BigNumber {
  return amountWei
    .times(fee)
    .div(new BigNumber(fee).plus(new BigNumber(FEE_BASE)))
    .abs()
    .integerValue(BigNumber.ROUND_DOWN)
}

export function calculateFixedFee(amountWei: BigNumber, fee: string): BigNumber {
  return amountWei.minus(fee).integerValue(BigNumber.ROUND_DOWN)
}

export function calculatePercentageFeeOnInputAmount(
  amountWei: BigNumber,
  fee: number = DEFAULT_FEE,
): BigNumber {
  return amountWei.times(fee).div(new BigNumber(FEE_BASE)).abs().integerValue(BigNumber.ROUND_UP)
}

export function calculateFixedFeeOnInputAmount(amountWei: BigNumber, fee: string): BigNumber {
  return amountWei.plus(fee).integerValue(BigNumber.ROUND_UP)
}
