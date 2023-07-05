import { AjnaEarnPosition } from '@dma-library/types'
import { AjnaSuccess } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export const validatePriceBetweenHtpAndLup = (
  position: AjnaEarnPosition,
  price: BigNumber,
): AjnaSuccess[] => {
  if (
    price.gte(position.pool.highestThresholdPrice) &&
    price.lt(position.pool.lowestUtilizedPrice) &&
    !position.pool.lowestUtilizedPriceIndex.isZero()
  ) {
    return [
      {
        name: 'price-between-htp-and-lup',
      },
    ]
  } else {
    return []
  }
}
