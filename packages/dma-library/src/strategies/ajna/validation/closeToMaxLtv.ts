import { AjnaPosition } from '../../../types/ajna'
import { AjnaWarning } from '../../../types/common'

const MAX_LTV_OFFSET = 0.05

export function validateGenerateCloseToMaxLtv(
  position: AjnaPosition,
  positionBefore: AjnaPosition,
): AjnaWarning[] {
  if (position.maxRiskRatio.loanToValue.minus(MAX_LTV_OFFSET).lte(position.riskRatio.loanToValue)) {
    return [
      {
        name: 'generate-close-to-max-ltv',
        data: {
          amount: position.debtAmount.minus(positionBefore.debtAmount).decimalPlaces(2).toString(),
        },
      },
    ]
  }
  return []
}

export function validateWithdrawCloseToMaxLtv(
  position: AjnaPosition,
  positionBefore: AjnaPosition,
): AjnaWarning[] {
  if (position.maxRiskRatio.loanToValue.minus(MAX_LTV_OFFSET).lte(position.riskRatio.loanToValue)) {
    return [
      {
        name: 'withdraw-close-to-max-ltv',
        data: {
          amount: position.collateralAmount
            .minus(positionBefore.collateralAmount)
            .decimalPlaces(5)
            .abs()
            .toString(),
        },
      },
    ]
  }
  return []
}
