import { DEFAULT_FEE, HIGH_MULTIPLE_FEE, NO_FEE } from '@dma-common/constants'
import { AAVETokens } from '@dma-library/types/aave'
import BigNumber from 'bignumber.js'

export const feeResolver = (
  fromToken: AAVETokens,
  toToken: AAVETokens,
  flags: {
    isIncreasingRisk?: boolean
    isEarnPosition?: boolean
    isEntrySwap?: boolean
  },
) => {
  if (flags.isEntrySwap) {
    return new BigNumber(DEFAULT_FEE)
  }
  if (fromToken === 'WSTETH' && toToken === 'ETH' && !flags.isIncreasingRisk) {
    return new BigNumber(HIGH_MULTIPLE_FEE)
  }
  if (flags.isIncreasingRisk && flags.isEarnPosition) {
    return new BigNumber(NO_FEE)
  }
  return new BigNumber(DEFAULT_FEE)
}
