import { AjnaEarnPosition, AjnaError } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export const validateLupBelowHtp = (
  position: AjnaEarnPosition,
  afterLupIndex?: BigNumber,
): AjnaError[] => {
  if (
    afterLupIndex &&
    new BigNumber(afterLupIndex.toString()).gt(position.pool.highestThresholdPriceIndex)
  ) {
    return [
      {
        name: 'after-lup-index-bigger-than-htp-index',
      },
    ]
  } else {
    return []
  }
}
