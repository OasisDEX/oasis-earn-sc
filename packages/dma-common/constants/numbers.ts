import { BigNumber } from 'bignumber.js'

export const ZERO = new BigNumber(0)
export const ONE = new BigNumber(1)
export const TEN = new BigNumber(10)
export const FIFTY = new BigNumber(50)
export const HUNDRED = new BigNumber(100)
export const ONE_THOUSAND = new BigNumber(10000)
export const ONE_TEN_THOUSANDTH = new BigNumber(0.0001)
export const TEN_THOUSAND = new BigNumber(10000)
export const MILLION = new BigNumber('1000000')
export const TEN_MILLION = new BigNumber('10000000')
export const BILLION = new BigNumber('1000000000')
export const MAX_UINT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

export const TYPICAL_PRECISION = 18

// If configuring a low LTV, we might not need a flashloan (therefore flashloan == 0), but we still perform
// the swap because the actions in operation executor pass args to each other referenced via index.
// 1inch however errors out when trying to swap 0 amount, so we swap some small amount instead.
// This is that amount.
export const UNUSED_FLASHLOAN_AMOUNT = ONE
