import { BigNumber } from 'bignumber.js'

import { BILLION, MILLION, ONE_TEN_THOUSANDTH, ONE_THOUSAND, TEN, ZERO } from './constants'

/* THESE METHODS ARE EXACT COPY FROM BORROW, WE COULD POTENTIALLY EXTRACT THEM TO SEPARATE PACKAGE */

export function toShorthandNumber(amount: BigNumber, suffix = '', precision?: number) {
  const sh = new BigNumber(
    amount
      .toString()
      .split('.')
      .map((part, index) => {
        if (index === 0) return part
        return part.substr(0, precision)
      })
      .filter(el => el)
      .join('.'),
  )
  if (precision) {
    return sh.toFixed(precision).concat(suffix)
  }
  return sh.toFixed().concat(suffix)
}

export function formatAsShorthandNumbers(amount: BigNumber, precision?: number): string {
  if (amount.absoluteValue().gte(BILLION)) {
    return toShorthandNumber(amount.dividedBy(BILLION), 'B', precision)
  }
  if (amount.absoluteValue().gte(MILLION)) {
    return toShorthandNumber(amount.dividedBy(MILLION), 'M', precision)
  }
  if (amount.absoluteValue().gte(ONE_THOUSAND)) {
    return toShorthandNumber(amount.dividedBy(ONE_THOUSAND), 'K', precision)
  }
  return toShorthandNumber(amount, '', precision)
}

export function formatCryptoBalance(amount: BigNumber): string {
  const absAmount = amount.absoluteValue()

  if (absAmount.eq(ZERO)) {
    return formatAsShorthandNumbers(amount, 2)
  }

  if (absAmount.lt(ONE_TEN_THOUSANDTH)) {
    return `${amount.isNegative() ? '0.000' : '<0.001'}`
  }

  if (absAmount.lt(TEN)) {
    return formatAsShorthandNumbers(amount, 4)
  }

  if (absAmount.lt(MILLION)) return amount.toFormat(2, BigNumber.ROUND_DOWN)

  return formatAsShorthandNumbers(amount, 2)
}
