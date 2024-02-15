import { AjnaEarnPosition } from '@dma-library/types'
import { AjnaNotice } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export const validatePriceBelowHtp = (
  position: AjnaEarnPosition,
  price: BigNumber,
): AjnaNotice[] => {
  if (
    price.lt(position.pool.highestThresholdPrice) &&
    position.pool.lowestUtilizedPriceIndex.lte(position.pool.highestThresholdPriceIndex)
  ) {
    return [
      {
        name: 'price-below-htp',
      },
    ]
  } else {
    return []
  }
}
