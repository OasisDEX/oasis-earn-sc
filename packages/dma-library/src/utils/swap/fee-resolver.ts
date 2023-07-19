import { DEFAULT_FEE, HIGH_MULTIPLE_FEE, NO_FEE } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

export const feeResolver = <T extends string = string>(
  fromToken: T,
  toToken: T,
  flags?: {
    isIncreasingRisk?: boolean
    isEarnPosition?: boolean
    isEntrySwap?: boolean
  },
) => {
  if (flags?.isEntrySwap) {
    return new BigNumber(DEFAULT_FEE)
  }
  if (fromToken === 'WSTETH' && toToken === 'ETH' && !flags?.isIncreasingRisk) {
    return new BigNumber(HIGH_MULTIPLE_FEE)
  }
  if (flags?.isIncreasingRisk && flags.isEarnPosition) {
    return new BigNumber(NO_FEE)
  }
  return new BigNumber(DEFAULT_FEE)
}

export function isCorrelatedPosition(symbolA: string, symbolB: string) {
  const correlatedAssetMatrix = [
    ['WSTETH', 'ETH', 'CBETH', 'RETH', 'STETH'],
    // Add more arrays here to expand the matrix in the future
  ]

  // Iterate over each row in the matrix
  for (let i = 0; i < correlatedAssetMatrix.length; i++) {
    // Check if both symbols are in the same row
    if (correlatedAssetMatrix[i].includes(symbolA) && correlatedAssetMatrix[i].includes(symbolB)) {
      return true
    }
  }

  // If we haven't found both symbols in the same row, they're not correlated
  return false
}
