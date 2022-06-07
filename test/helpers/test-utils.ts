import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { isError, tryF } from 'ts-try'

export function logDebug(lines: string[], prefix = '') {
  lines.forEach(line => console.log(`${prefix}${line}`))
}

export function asPercentageValue(value: BigNumber.Value, base: BigNumber.Value) {
  const val = new BigNumber(value)

  return {
    get value() {
      return val
    },

    asDecimal: val.div(base),
  }
}

export function expectToBeEqual(lhs: BigNumber.Value, rhs: BigNumber.Value, precision?: number) {
  const [a, b] = [lhs, rhs].map(value => new BigNumber(value))
  const [formattedA, formattedB] =
    typeof precision === 'number'
      ? [a, b].map(num => num.toFixed(precision))
      : [a, b].map(num => num.toFixed())
  expect(formattedA).to.be.eq(formattedB)
}

export function expectToBe(
  lhs: BigNumber.Value,
  comp: 'gt' | 'lt' | 'gte' | 'lte',
  rhs: BigNumber.Value,
) {
  const [a, b] = [lhs, rhs].map(value => new BigNumber(value))
  const result = tryF(() => [a, b].map(num => num.toNumber()))
  if (isError(result)) {
    expect(a[comp](b)).to.be.true
  } else {
    expect(result[0]).to.be[comp](result[1])
  }
}
