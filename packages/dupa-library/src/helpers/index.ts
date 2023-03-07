import BigNumber from 'bignumber.js'

export function calculateFee(amountWei: BigNumber, fee: BigNumber, feeBase: BigNumber): BigNumber {
  return amountWei
    .times(fee)
    .div(new BigNumber(fee).plus(feeBase))
    .abs()
    .integerValue(BigNumber.ROUND_DOWN)
}

export function amountFromWei(amount: BigNumber, decimals = 18): BigNumber {
  return amount.div(new BigNumber(10).pow(decimals))
}

export function logDebug(lines: string[], prefix = '') {
  lines.forEach(line => console.log(`${prefix}${line}`))
}

export function amountToWei(amount: BigNumber.Value, precision = 18) {
  BigNumber.config({ EXPONENTIAL_AT: 30 })
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision))
}
