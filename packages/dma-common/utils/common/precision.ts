import BigNumber from 'bignumber.js'

/**
 * Convert base unit to fractional unit with optional precision
 * @example
 * amountToWei(1, 18)
 */
export function amountToWei(amount: BigNumber.Value, precision = 18) {
  BigNumber.config({ EXPONENTIAL_AT: 30 })
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision))
}

/**
 * Convert fractional unit to base unit with optional precision
 * @example
 * amountFromWei(1, 18)
 */
export function amountFromWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).div(new BigNumber(10).pow(precision))
}
