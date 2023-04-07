import BigNumber from 'bignumber.js'

export function calculateFee(amountWei: BigNumber, fee: BigNumber, feeBase: BigNumber): BigNumber {
  return amountWei
    .times(fee)
    .div(new BigNumber(fee).plus(feeBase))
    .abs()
    .integerValue(BigNumber.ROUND_DOWN)
}
