import { EModeCategoryData } from '@dma-library/protocols/aave-like'
import { AaveLikePosition } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export function applyEmodeCategory(
  position: AaveLikePosition,
  eModeCategoryData: EModeCategoryData | undefined,
) {
  if (!eModeCategoryData) return position

  position.category = {
    ...position.category,
    liquidationThreshold: new BigNumber(eModeCategoryData.liquidationThreshold.toString()).div(
      10000,
    ),
  }

  return position
}
