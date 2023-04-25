import { TEN } from '@dma-common/constants'
import BigNumber from 'bignumber.js'
import { isError, tryF } from 'ts-try'

export function amountToWei(amount: BigNumber.Value, precision = 18) {
  BigNumber.config({ EXPONENTIAL_AT: 30 })
  return new BigNumber(amount || 0).times(new BigNumber(10).pow(precision))
}

export function amountFromWei(amount: BigNumber.Value, precision = 18) {
  return new BigNumber(amount || 0).div(new BigNumber(10).pow(precision))
}

export function ensureWeiFormat(
  input: BigNumber.Value, // TODO:
  interpretBigNum = true,
) {
  const bn = new BigNumber(input)

  const result = tryF(() => {
    if (interpretBigNum && bn.lt(TEN.pow(9))) {
      return bn.times(TEN.pow(18))
    }

    return bn
  })

  if (isError(result)) {
    throw Error(`Error running \`ensureWeiFormat\` with input ${input.toString()}: ${result}`)
  }

  return result.decimalPlaces(0).toFixed(0)
}
