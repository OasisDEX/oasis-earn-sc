import { TYPICAL_PRECISION } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

/**
 * We normalise to 18 decimal places rather than reducing precision to a token base unit EG Where 1 ETH = 1e18 rather than 1
 * The reason for this is that our worked examples in Excel require numbers to be normalised in this manner
 * Otherwise Excel cannot handle the precision of the numbers
 *
 * TODO: Mark these as legacy and replace with normalisation where 1 ETH = 1. Then only use 1e18 normalisation for Excel examples
 *
 * */
export function normaliseAmount(amount: BigNumber, precision: number): BigNumber {
  return amount.times(10 ** (TYPICAL_PRECISION - precision))
}

export function denormaliseAmount(amount: BigNumber, precision: number): BigNumber {
  return amount.div(10 ** (TYPICAL_PRECISION - precision))
}
