import { AjnaPosition } from '../../../types/ajna'
import { AjnaError } from '../../../types/common'

export function validateBorrowUndercollateralized(
  position: AjnaPosition,
  positionBefore: AjnaPosition,
): AjnaError[] {
  if (position.thresholdPrice.gt(position.pool.lowestUtilizedPrice)) {
    return [
      {
        name: 'borrow-undercollateralized',
        data: {
          amount: positionBefore.debtAvailable.decimalPlaces(2).toString(),
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
          amount: positionBefore.collateralAvailable.decimalPlaces(2).toString(),
        },
      },
    ]
  }
  return []
}
