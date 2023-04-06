import BigNumber from 'bignumber.js'

import { AjnaEarnPosition } from '../../../types/ajna'
import { AjnaEarnActions, AjnaError, AjnaWarning } from '../../../types/common'

export const getAjnaValidations = ({
  price,
  quoteAmount,
  position,
  afterLupIndex,
  action,
}: {
  price: BigNumber
  quoteAmount: BigNumber
  position: AjnaEarnPosition
  simulation: AjnaEarnPosition
  afterLupIndex?: BigNumber
  action: AjnaEarnActions
}) => {
  const errors: AjnaError[] = []
  const warnings: AjnaWarning[] = []

  // common
  if (price.gt(position.pool.mostOptimisticMatchingPrice)) {
    errors.push({
      name: 'price-above-momp',
    })
  }

  if (price.lt(position.pool.highestThresholdPrice)) {
    warnings.push({
      name: 'price-below-htp',
    })
  }

  // action specific
  switch (action) {
    case 'open-earn':
    case 'deposit-earn': {
      break
    }
    case 'withdraw-earn': {
      if (position.quoteTokenAmount.lt(quoteAmount)) {
        errors.push({
          name: 'withdraw-more-than-available',
          data: {
            amount: position.quoteTokenAmount.decimalPlaces(2).toString(),
          },
        })
      }

      if (
        afterLupIndex &&
        new BigNumber(afterLupIndex.toString()).gt(position.pool.highestThresholdPriceIndex)
      ) {
        errors.push({
          name: 'after-lup-index-bigger-than-htp-index',
        })
      }
      break
    }
    default:
      break
  }

  return { errors, warnings }
}
