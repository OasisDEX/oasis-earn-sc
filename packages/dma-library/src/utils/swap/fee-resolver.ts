import { DEFAULT_FEE, NO_FEE } from '@dma-common/constants'
import { REDUCED_FEE } from '@oasisdex/dma-common/constants/fee'
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
  const DEFAULT_FEE_BN = new BigNumber(DEFAULT_FEE)
  const NO_FEE_BN = new BigNumber(NO_FEE)
  const REDUCED_FEE_BN = new BigNumber(REDUCED_FEE)

  let type = 'defaultMultiply'
  if (flags?.isEntrySwap) {
    type = 'entry'
  }

  const feesMap = {
    entry: {
      onIncrease: DEFAULT_FEE_BN,
      onDecrease: DEFAULT_FEE_BN,
    },
    earnMultiply: {
      onIncrease: NO_FEE_BN,
      onDecrease: REDUCED_FEE_BN,
    },
    defaultMultiply: {
      onIncrease: DEFAULT_FEE_BN,
      onDecrease: DEFAULT_FEE_BN,
    },
  }

  if (flags?.isEntrySwap) {
    return new BigNumber(DEFAULT_FEE)
  }
  // Previously only fromToken === 'WSTETH' && toToken === 'ETH'
  if (isCorrelatedPosition(fromToken, toToken) && !flags?.isIncreasingRisk) {
    return new BigNumber(REDUCED_FEE)
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
