import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import {
  AjnaEarnActions,
  AjnaEarnPosition,
  AjnaError,
  AjnaNotice,
  AjnaSuccess,
  AjnaWarning,
} from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export const getAjnaEarnValidations = ({
  price,
  quoteAmount,
  quoteTokenPrecision,
  position,
  afterLupIndex,
  action,
}: {
  price: BigNumber
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  position: AjnaEarnPosition
  simulation: AjnaEarnPosition
  afterLupIndex?: BigNumber
  action: AjnaEarnActions
}) => {
  const errors: AjnaError[] = []
  const warnings: AjnaWarning[] = []
  const notices: AjnaNotice[] = []
  const successes: AjnaSuccess[] = []

  // common
  if (price.lt(position.pool.highestThresholdPrice)) {
    notices.push({
      name: 'price-below-htp',
    })
  }

  if (
    price.gte(position.pool.highestThresholdPrice) &&
    price.lt(position.pool.lowestUtilizedPrice)
  ) {
    successes.push({
      name: 'price-between-htp-and-lup',
    })
  }

  if (
    price.gte(position.pool.lowestUtilizedPrice) &&
    price.lt(position.pool.mostOptimisticMatchingPrice)
  ) {
    successes.push({
      name: 'price-between-lup-and-momp',
      data: {
        lup: formatCryptoBalance(position.pool.lowestUtilizedPrice),
      },
    })
  }

  if (price.gt(position.pool.mostOptimisticMatchingPrice)) {
    warnings.push({
      name: 'price-above-momp',
    })
  }

  // action specific
  switch (action) {
    case 'open-earn':
    case 'deposit-earn':
    case 'claim-earn': {
      break
    }
    case 'withdraw-earn': {
      if (
        position.quoteTokenAmount
          .decimalPlaces(quoteTokenPrecision, BigNumber.ROUND_UP)
          .lt(quoteAmount)
      ) {
        errors.push({
          name: 'withdraw-more-than-available',
          data: {
            amount: formatCryptoBalance(position.quoteTokenAmount),
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

  return { errors, warnings, notices, successes }
}
