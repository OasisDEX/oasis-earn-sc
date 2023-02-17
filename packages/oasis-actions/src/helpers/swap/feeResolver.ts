import BigNumber from 'bignumber.js'

import { AAVETokens } from '../../types/aave'
import { DEFAULT_FEE, HIGH_MULTIPLE_FEE, NO_FEE } from '../constants'

export const feeResolver = (
  collateralSymbol: AAVETokens,
  debtSymbol: AAVETokens,
  isIncreasingRisk?: boolean,
  isEarnPosition?: boolean,
) => {
  if (collateralSymbol === 'WSTETH' && debtSymbol === 'ETH') {
    return new BigNumber(HIGH_MULTIPLE_FEE)
  }
  if (isIncreasingRisk && isEarnPosition) {
    return new BigNumber(NO_FEE)
  }
  return new BigNumber(DEFAULT_FEE)
}
