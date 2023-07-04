import { AjnaEarnPosition } from '@dma-library/types'
import { AjnaNotice } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export const validatePriceBelowHtp = (
  position: AjnaEarnPosition,
  price: BigNumber,
): AjnaNotice[] => {
  if (price.lt(position.pool.highestThresholdPrice)) {
    return [
      {
        name: 'price-below-htp',
      },
    ]
  } else {
    return []
  }
}
