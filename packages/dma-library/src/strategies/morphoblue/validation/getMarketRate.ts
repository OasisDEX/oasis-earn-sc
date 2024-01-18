import { BigNumber } from 'bignumber.js'

export function getMarketRate(rate: string): BigNumber {
  return new BigNumber(
    Math.E **
      new BigNumber(rate)
        .shiftedBy(-18)
        .times(3600 * 24 * 365)
        .toNumber() -
      1,
  )
}
