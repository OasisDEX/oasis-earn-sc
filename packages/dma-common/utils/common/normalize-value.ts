import BigNumber from 'bignumber.js'


export function normalizeValue(value: BigNumber): BigNumber {
  return !value.isNaN() && value.isFinite() ? value : ZERO
}
