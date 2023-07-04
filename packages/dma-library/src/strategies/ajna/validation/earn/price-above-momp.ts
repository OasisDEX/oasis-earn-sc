import { AjnaEarnPosition } from '@dma-library/types'
import { AjnaWarning } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export const validatePriceAboveMomp = (
  position: AjnaEarnPosition,
  price: BigNumber,
): AjnaWarning[] => {
  if (price.gt(position.pool.mostOptimisticMatchingPrice)) {
    return [
      {
        name: 'price-above-momp',
      },
    ]
  } else {
    return []
  }
}
