// TODO: Add comments for these functions

import { TYPICAL_PRECISION } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

export function normaliseAmount(amount: BigNumber, precision: number): BigNumber {
  return amount.div(10 ** precision)
}

export function denormaliseAmount(amount: BigNumber, precision: number): BigNumber {
  return amount.div(10 ** precision)
}

// TODO: Add comments
export function legacyNormaliseAmount(amount: BigNumber, precision: number): BigNumber {
  return amount.times(10 ** (TYPICAL_PRECISION - precision))
}

export function legacyDenormaliseAmount(amount: BigNumber, precision: number): BigNumber {
  return amount.div(10 ** (TYPICAL_PRECISION - precision))
}
