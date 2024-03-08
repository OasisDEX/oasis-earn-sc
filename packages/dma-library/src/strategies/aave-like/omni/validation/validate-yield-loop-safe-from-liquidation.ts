import { formatDecimalAsPercent } from '@dma-common/utils/common'
import { AaveLikePositionV2 } from '@dma-library/types'
import { AjnaSuccess } from '@dma-library/types/ajna'
import { aaveLikeLiquidationThresholdOffset } from '@dma-library/views/aave-like'

export function validateYieldLoopSafeFromLiquidation(
  position: AaveLikePositionV2,
  targetPosition: AaveLikePositionV2,
): AjnaSuccess[] {
  const rangeToLiquidation = position.category.liquidationThreshold.minus(
    targetPosition.riskRatio.loanToValue,
  )

  if (rangeToLiquidation.gt(aaveLikeLiquidationThresholdOffset)) {
    return [
      {
        name: 'yield-loop-safe-from-liquidation',
        data: {
          rangeToLiquidation: formatDecimalAsPercent(rangeToLiquidation),
          liquidationPenalty: formatDecimalAsPercent(position.liquidationPenalty),
        },
      },
    ]
  }

  return []
}
