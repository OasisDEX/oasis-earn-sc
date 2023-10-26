import { formatCryptoBalance } from '@dma-common/utils/common'
import { AjnaEarnPosition } from '@dma-library/types'
import { AjnaSuccess } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export const validatePriceAboveLup = (
  position: AjnaEarnPosition,
  price: BigNumber,
): AjnaSuccess[] => {
  if (price.gte(position.pool.lowestUtilizedPrice)) {
    return [
      {
        name: 'price-above-lup',
        data: {
          lup: formatCryptoBalance(position.pool.lowestUtilizedPrice),
        },
      },
    ]
  } else {
    return []
  }
}
