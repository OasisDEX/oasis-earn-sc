import { formatCryptoBalance } from '@dma-common/utils/common'
import { AjnaError, MorphoBluePosition } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export function validateWithdrawUndercollateralized(
  targetPosition: MorphoBluePosition,
  position: MorphoBluePosition,
  collateralPrecision: number,
  collateralToWithdraw: BigNumber,
): AjnaError[] {
  const resolvedDebtAmount = targetPosition?.debtAmount || position.debtAmount
  const resolvedLtv = targetPosition?.maxRiskRatio.loanToValue || position.maxRiskRatio.loanToValue

  const withdrawMax = position.collateralAmount
    .minus(resolvedDebtAmount.div(resolvedLtv).div(position.price))
    .decimalPlaces(collateralPrecision, BigNumber.ROUND_DOWN)

  if (collateralToWithdraw.gt(withdrawMax)) {
    return [
      {
        name: 'withdraw-undercollateralized',
        data: {
          amount: formatCryptoBalance(withdrawMax),
        },
      },
    ]
  }

  return []
}
