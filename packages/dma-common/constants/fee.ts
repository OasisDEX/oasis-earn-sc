import { BigNumber } from 'bignumber.js'

export const NO_FEE = 0
export const REDUCED_FEE = 7
export const DEFAULT_FEE = 20
export const FEE_BASE = 10000
// We inflate the estimate fee amount to account for difference between quoted market prices and actual amounts
export const FEE_ESTIMATE_INFLATOR = new BigNumber(0.01)
