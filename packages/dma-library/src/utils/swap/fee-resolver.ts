import { DEFAULT_FEE, HIGH_MULTIPLE_FEE, NO_FEE } from '@dma-common/constants'
import { AAVETokens } from '@dma-library/types/aave'
import BigNumber from 'bignumber.js'

export const feeResolver = (
  collateralSymbol: AAVETokens,
  debtSymbol: AAVETokens,
  isIncreasingRisk?: boolean,
  isEarnPosition?: boolean,
) => {
  if (collateralSymbol === 'WSTETH' && debtSymbol === 'ETH' && !isIncreasingRisk) {
    return new BigNumber(HIGH_MULTIPLE_FEE)
  }
  if (isIncreasingRisk && isEarnPosition) {
    return new BigNumber(NO_FEE)
  }
  return new BigNumber(DEFAULT_FEE)
}
