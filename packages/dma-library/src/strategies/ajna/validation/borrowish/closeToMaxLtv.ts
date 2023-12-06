import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { AjnaPosition, AjnaWarning } from '@dma-library/types/ajna'

const MAX_LTV_OFFSET = 0.05

export function validateGenerateCloseToMaxLtv(
  position: AjnaPosition,
  positionBefore: AjnaPosition,
): AjnaWarning[] {
  if (
    position.maxRiskRatio.loanToValue.minus(MAX_LTV_OFFSET).lte(position.riskRatio.loanToValue) &&
    !positionBefore.debtAmount.eq(position.debtAmount)
  ) {
    return [
      {
        name: 'generate-close-to-max-ltv',
        data: {
          amount: formatCryptoBalance(position.debtAmount.minus(positionBefore.debtAmount)),
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
  if (
    position.maxRiskRatio.loanToValue.minus(MAX_LTV_OFFSET).lte(position.riskRatio.loanToValue) &&
    !positionBefore.collateralAmount.eq(position.collateralAmount)
  ) {
    return [
      {
        name: 'withdraw-close-to-max-ltv',
        data: {
          amount: formatCryptoBalance(
            position.collateralAmount.minus(positionBefore.collateralAmount).abs(),
          ),
        },
      },
    ]
  }
  return []
}
