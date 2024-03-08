import { formatDecimalAsPercent } from '@dma-common/utils/common'
import { AaveLikePositionV2 } from '@dma-library/types'
import { AjnaWarning } from '@dma-library/types/ajna'
import { aaveLikeLiquidationThresholdOffset } from '@dma-library/views/aave-like'

export function validateYieldLoopCloseToLiquidation(
  position: AaveLikePositionV2,
  targetPosition: AaveLikePositionV2,
): AjnaWarning[] {
  const rangeToLiquidation = position.category.liquidationThreshold.minus(
    targetPosition.riskRatio.loanToValue,
  )

  if (rangeToLiquidation.lte(aaveLikeLiquidationThresholdOffset)) {
    return [
      {
        name: 'yield-loop-close-to-liquidation',
        data: {
          rangeToLiquidation: formatDecimalAsPercent(rangeToLiquidation),
          liquidationPenalty: formatDecimalAsPercent(position.liquidationPenalty),
        },
      },
    ]
  }

  return []
}
