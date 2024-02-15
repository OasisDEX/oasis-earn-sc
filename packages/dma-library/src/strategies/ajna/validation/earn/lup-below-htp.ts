import { AjnaEarnPosition, AjnaError } from '@dma-library/types'
import { AjnaEarnActions } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export const validateLupBelowHtp = (
  position: AjnaEarnPosition,
  simulation: AjnaEarnPosition,
  action: AjnaEarnActions,
  afterLupIndex?: BigNumber,
): AjnaError[] => {
  if (
    action === 'deposit-earn' &&
    position.pool.lowestUtilizedPriceIndex.gt(position.pool.highestThresholdPriceIndex) &&
    simulation.price.gte(position.price)
  ) {
    return []
  }

  if (afterLupIndex?.gt(position.pool.highestThresholdPriceIndex)) {
    return [
      {
        name:
          action === 'deposit-earn'
            ? 'after-lup-index-bigger-than-htp-index-deposit'
            : 'after-lup-index-bigger-than-htp-index-withdraw',
      },
    ]
  } else {
    return []
  }
}
