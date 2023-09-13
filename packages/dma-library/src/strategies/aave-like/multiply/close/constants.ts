import BigNumber from 'bignumber.js'

// This covers off the situation where debt balances accrue interest
export const SAFETY_MARGIN = new BigNumber(0.0001)
