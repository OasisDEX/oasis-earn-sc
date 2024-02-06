import { BigNumber } from 'bignumber.js'

import { ZERO } from '../../constants'

export const negativeToZero = (value: BigNumber) => (value.lt(ZERO) ? ZERO : value)
