import { formatCryptoBalance } from '@dma-common/utils/common'
import { AjnaEarnPosition } from '@dma-library/types'
import { AjnaSuccess } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export const validatePriceBetweenLupAndMomp = (
  position: AjnaEarnPosition,
  price: BigNumber,
): AjnaSuccess[] => {
  if (
    price.gte(position.pool.lowestUtilizedPrice) &&
    price.lt(position.pool.mostOptimisticMatchingPrice)
  ) {
    return [
      {
        name: 'price-between-lup-and-momp',
        data: {
          lup: formatCryptoBalance(position.pool.lowestUtilizedPrice),
        },
      },
    ]
  } else {
    return []
  }
}
