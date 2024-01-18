import { AjnaError, MorphoBluePosition } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { validateLiquidity } from './validateLiquidity'

export function validateBorrowUndercollateralized(
  position: MorphoBluePosition,
  targetPosition: MorphoBluePosition,
  borrowAmount: BigNumber,
  quotePrecision: number,
): AjnaError[] {
  if (validateLiquidity(position, borrowAmount, quotePrecision).length > 0) {
    return []
  }

  if (targetPosition.riskRatio.loanToValue.gt(targetPosition.maxRiskRatio.loanToValue)) {
    return [
      {
        name: 'borrow-undercollateralized',
        data: {
          amount: borrowAmount.toString(),
        },
      },
    ]
  }

  return []
}
