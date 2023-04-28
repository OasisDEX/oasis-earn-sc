import BigNumber from 'bignumber.js'

import { ZERO } from '../../constants'

export function normalizeValue(value: BigNumber): BigNumber {
  return !value.isNaN() && value.isFinite() ? value : ZERO
}
