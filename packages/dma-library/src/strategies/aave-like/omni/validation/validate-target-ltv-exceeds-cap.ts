import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { AaveLikePositionV2, AjnaError } from '@dma-library/types'

export function validateTargetLtvExceedsCap(
  position: AaveLikePositionV2,
  targetPosition: AaveLikePositionV2,
): AjnaError[] {
  const maxSupply = position.reserveData.collateral.availableToSupply
  const maxBorrow = position.reserveData.debt.availableToBorrow

  if (targetPosition.collateralAmount.minus(position.collateralAmount).gt(maxSupply)) {
    return [
      {
        name: 'target-ltv-exceeds-supply-cap',
        data: {
          cap: formatCryptoBalance(maxSupply),
        },
      },
    ]
  }

  if (targetPosition.debtAmount.minus(position.debtAmount).gt(maxBorrow)) {
    return [
      {
        name: 'target-ltv-exceeds-borrow-cap',
        data: {
          cap: formatCryptoBalance(maxBorrow),
        },
      },
    ]
  }

  return []
}
