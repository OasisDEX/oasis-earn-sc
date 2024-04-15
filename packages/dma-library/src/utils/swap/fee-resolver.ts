import { DEFAULT_FEE, LOW_CORRELATED_ASSET_FEE, NO_FEE } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

import { correlatedAssetDictionary } from './correlated-assets'

export const feeResolver = <T extends string = string>(
  fromToken: T,
  toToken: T,
  flags?: {
    isIncreasingRisk?: boolean
    /** @deprecated Should rely on correlated asset matrix  */
    isEarnPosition?: boolean
    isEntrySwap?: boolean
  },
) => {
  let type = 'defaultMultiply'
  if (isCorrelatedPosition(fromToken, toToken) || flags?.isEarnPosition) {
    type = 'earnMultiply'
  }
  // overrides earnMultiply type
  if (isCorrelatedLowFeePosition(fromToken, toToken)) {
    type = 'lowFeeMultiply'
  }
  if (flags?.isEntrySwap) {
    // Should override multiply type given position type isn't relevant if the swap is an entry swap
    type = 'entry'
  }
  const feesConfig = {
    entry: {
      onIncrease: new BigNumber(DEFAULT_FEE),
      onDecrease: new BigNumber(DEFAULT_FEE),
    },
    earnMultiply: {
      onIncrease: new BigNumber(NO_FEE),
      onDecrease: new BigNumber(NO_FEE),
    },
    defaultMultiply: {
      onIncrease: new BigNumber(DEFAULT_FEE),
      onDecrease: new BigNumber(DEFAULT_FEE),
    },
    lowFeeMultiply: {
      onIncrease: new BigNumber(LOW_CORRELATED_ASSET_FEE),
      onDecrease: new BigNumber(LOW_CORRELATED_ASSET_FEE),
    },
  }

  const feeToCharge = feesConfig[type][flags?.isIncreasingRisk ? 'onIncrease' : 'onDecrease']
  if (!feeToCharge) {
    throw new Error('No fee could be resolved')
  }

  return feeToCharge
}

/**
 * Checks if two symbols are in a correlated position.
 * @param symbolA - The first symbol.
 * @param symbolB - The second symbol.
 * @returns True if the symbols are in a correlated position, false otherwise.
 */
export function isCorrelatedPosition(symbolA: string, symbolB: string) {
  const correlatedAssetMatrix = [
    correlatedAssetDictionary.CorrelatedAssetFee.ETH,
    correlatedAssetDictionary.CorrelatedAssetFee.BTC,
    correlatedAssetDictionary.CorrelatedAssetFee.Stable,
    // Add more arrays here to expand the matrix in the future
  ]

  // Iterate over each row in the matrix
  for (let i = 0; i < correlatedAssetMatrix.length; i++) {
    // Check if both symbols are in the same row
    if (
      correlatedAssetMatrix[i].includes(symbolA.toUpperCase()) &&
      correlatedAssetMatrix[i].includes(symbolB.toUpperCase())
    ) {
      return true
    }
  }

  // If we haven't found both symbols in the same row, they're not correlated
  return false
}

/**
 * Checks if two symbols are in a correlated low fee position.
 * @param symbolA - The first symbol.
 * @param symbolB - The second symbol.
 * @returns True if the symbols are in a correlated low fee position, false otherwise.
 */
export function isCorrelatedLowFeePosition(symbolA: string, symbolB: string) {
  const correlatedAssetMatrix = [
    correlatedAssetDictionary.LowCorrelatedAssetFee.Stable,
    correlatedAssetDictionary.LowCorrelatedAssetFee.ETH,
    correlatedAssetDictionary.LowCorrelatedAssetFee.BTC,
    // Add more arrays here to expand the matrix in the future
  ]
  // Iterate over each row in the matrix
  for (let i = 0; i < correlatedAssetMatrix.length; i++) {
    // Check if both symbols are in the same row
    if (
      correlatedAssetMatrix[i].includes(symbolA.toUpperCase()) &&
      correlatedAssetMatrix[i].includes(symbolB.toUpperCase())
    ) {
      return true
    }
  }

  // If we haven't found both symbols in the same row, they're not correlated
  return false
}
