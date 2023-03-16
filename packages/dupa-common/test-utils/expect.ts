import BigNumber from 'bignumber.js'
import { expect as chaiExpect } from 'chai'
import { isError, tryF } from 'ts-try'

export function toBeEqual(
  lhs: BigNumber.Value,
  rhs: BigNumber.Value,
  precision?: number,
  message?: string,
): void {
  const [a, b] = [lhs, rhs].map(value => new BigNumber(value))
  const [formattedA, formattedB] =
    typeof precision === 'number'
      ? [a, b].map(num => num.toFixed(precision))
      : [a, b].map(num => num.toFixed())
  expect(formattedA, message).to.be.eq(formattedB)
}

export function toBe(
  lhs: BigNumber.Value,
  comp: 'gt' | 'lt' | 'gte' | 'lte',
  rhs: BigNumber.Value,
  message?: string,
) {
  const [a, b] = [lhs, rhs].map(value => new BigNumber(value))
  const result = tryF(() => [a, b].map(num => num.toNumber()))
  if (isError(result)) {
    expect(a[comp](b)).to.be.true
  } else {
    expect(result[0], message).to.be[comp](result[1])
  }
}

export async function revert(expression: RegExp, tx: Promise<unknown>) {
  const result = await tryF(async () => await tx)
  if (isError(result)) {
    expect(
      expression.test(result.message),
      `Expect the revert to match ${expression.toString()}, reverted with: ${result.message}`,
    ).to.be.true
  } else {
    expect('Tx to fail', 'Tx should revert').to.be.eq('Tx succeeded')
  }
}

class Callable extends Function {
  constructor() {
    super()
    return new Proxy(this, {
      apply: (target, thisArg, args) => target._call(...args)
    })
  }

  _call(...args) {
    return chaiExpect(args)
  }

  toBe(...args) {
    return toBe(...args)
  }

  toBeEqual(...args) {
    return toBeEqual(...args)
  }

  revert(...args) {
    return revert(...args)
  }
}

const expect = new Callable()

export { expect }
