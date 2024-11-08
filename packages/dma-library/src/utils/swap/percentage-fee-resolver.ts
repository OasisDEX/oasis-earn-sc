import { DEFAULT_FEE, LOW_CORRELATED_ASSET_FEE } from '@dma-common/constants'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import type { ResolvedFee } from './fee-resolver'
import { isCorrelatedPosition } from './isCorrelatedPosition'

export const percentageFeeResolver = <T extends string = string>(
  fromToken: T,
  toToken: T,
  options?: {
    isIncreasingRisk?: boolean
    /** @deprecated Should rely on correlated asset matrix  */
    isEarnPosition?: boolean
    /** if the swap is an entry swap */
    isEntrySwap?: boolean
  },
): ResolvedFee => {
  let type = 'defaultMultiply'
  if (isCorrelatedPosition(fromToken, toToken) || options?.isEarnPosition) {
    type = 'earnMultiply'
  }
  // overrides earnMultiply type
  if (isCorrelatedLowFeePosition(fromToken, toToken)) {
    type = 'lowFeeMultiply'
  }
  if (options?.isEntrySwap) {
    // Should override multiply type given position type isn't relevant if the swap is an entry swap
    type = 'entry'
  }
  const feesConfig = {
    entry: {
      onIncrease: new BigNumber(DEFAULT_FEE),
      onDecrease: new BigNumber(DEFAULT_FEE),
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

  const feeType = SwapFeeType.Percentage

  let feeToCharge
  if (type === 'earnMultiply') {
    // new AUM type fee for yield loops
    throw new Error('AUM fee is required for earn multiply correlated assets')
  } else {
    feeToCharge = feesConfig[type][options?.isIncreasingRisk ? 'onIncrease' : 'onDecrease']
    if (!feeToCharge) {
      throw new Error('No fee could be resolved')
    }
  }
  console.log('Percentage fee:', { feeType, feeToCharge, options })

  return { feeType, feeToCharge }
}

/**
 * Checks if two symbols are in a correlated low fee position.
 * @param symbolA - The first symbol.
 * @param symbolB - The second symbol.
 * @returns True if the symbols are in a correlated low fee position, false otherwise.
 */
export function isCorrelatedLowFeePosition(symbolA: string, symbolB: string) {
  const correlatedAssetMatrix = [
    [
      'DAI',
      'USDT',
      'USDC',
      'PYUSD',
      'FRAX',
      'LUSD',
      'GUSD',
      'CRVUSD',
      'SDAI',
      'SUSDE',
      'USDE',
      'AETHSDAI',
      'AETHUSDC',
      'AETHUSDT',
      'AETHDAI',
      'AETHPYUSD',
      'AETHLUSD',
      'AUSDC',
      'ADAI',
      'AUSDT',
      'CUSDCV3',
      'CDAI',
      'CUSDC',
      'SUSD',
      'USDC.E',
    ],
    [
      'WSTETH',
      'RETH',
      'CBETH',
      'STETH',
      'AETHWSTETH',
      'AETHWETH',
      'AETHRETH',
      'AETHCBETH',
      'ASETH',
      'AWETH',
      'CETH',
      'CWETHV3',
      'WEETH',
      'WETH',
    ],
    ['WBTC', 'TBTC', 'AWBTC', 'AETHWBTC'],
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
