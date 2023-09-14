import { DEFAULT_FEE, NO_FEE, REDUCED_FEE } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

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
      onDecrease: new BigNumber(REDUCED_FEE),
    },
    defaultMultiply: {
      onIncrease: new BigNumber(DEFAULT_FEE),
      onDecrease: new BigNumber(DEFAULT_FEE),
    },
  }

  const feeToCharge = feesConfig[type][flags?.isIncreasingRisk ? 'onIncrease' : 'onDecrease']
  if (!feeToCharge) {
    throw new Error('No fee could be resolved')
  }

  return feeToCharge
}

export function isCorrelatedPosition(symbolA: string, symbolB: string) {
  const correlatedAssetMatrix = [
    ['ETH', 'WSTETH', 'CBETH', 'RETH', 'STETH'], // ETH correlated assets
    ['WBTC', 'TBTC'], // BTC correlated assets
    ['USDC', 'DAI', 'GHO', 'SDAI'], // USDC correlated assets
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
