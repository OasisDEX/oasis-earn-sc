import BigNumber from 'bignumber.js'

export type Percentage = {
  value: BigNumber
  asDecimal: BigNumber
}

export function asPercentageValue(value: BigNumber.Value, base: BigNumber.Value): Percentage {
  const val = new BigNumber(value)

  return {
    get value() {
      return val
    },

    asDecimal: val.div(base),
  }
}
