import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { validateLiquidity } from '@dma-library/strategies/ajna/validation/borrowish/notEnoughLiquidity'
import { AjnaError, AjnaPosition } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export function validateBorrowUndercollateralized(
  position: AjnaPosition,
  positionBefore: AjnaPosition,
  borrowAmount: BigNumber,
): AjnaError[] {
  if (validateLiquidity(position, positionBefore, borrowAmount).length) {
    return []
  }

  const maxDebt = positionBefore.debtAvailable(position.collateralAmount)

  if (position.debtAmount.gt(maxDebt.plus(positionBefore.debtAmount))) {
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

export function validateWithdrawUndercollateralized(
  position: AjnaPosition,
  positionBefore: AjnaPosition,
): AjnaError[] {
  if (position.thresholdPrice.gt(position.pool.lowestUtilizedPrice)) {
    return [
      {
        name: 'withdraw-undercollateralized',
        data: {
          amount: formatCryptoBalance(positionBefore.collateralAvailable),
        },
      },
    ]
  }
  return []
}
