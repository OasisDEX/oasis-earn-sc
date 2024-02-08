import { formatCryptoBalance } from '@dma-common/utils/common'
import { AjnaError, MorphoBluePosition } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { validateLiquidity } from './validateLiquidity'

export function validateBorrowUndercollateralized(
  targetPosition: MorphoBluePosition,
  position: MorphoBluePosition,
  borrowAmount: BigNumber,
): AjnaError[] {
  if (validateLiquidity(position, targetPosition, borrowAmount).length > 0) {
    return []
  }

  if (targetPosition.riskRatio.loanToValue.gt(targetPosition.maxRiskRatio.loanToValue)) {
    const maxDebt = position.debtAvailable(
      targetPosition?.collateralAmount || position.collateralAmount,
      position.debtAmount,
    )

    return [
      {
        name: 'borrow-undercollateralized',
        data: {
          amount: formatCryptoBalance(maxDebt),
        },
      },
    ]
  }

  return []
}
