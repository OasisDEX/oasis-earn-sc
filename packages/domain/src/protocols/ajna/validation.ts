
import BigNumber from 'bignumber.js'
import { AjnaEarnActions } from './ajna-earn-actions'
import { AjnaEarnPosition } from './ajna-earn-position'

export const getAjnaValidations = ({
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
      if (
        position.quoteTokenAmount
          .decimalPlaces(quoteTokenPrecision, BigNumber.ROUND_UP)
          .lt(quoteAmount)
      ) {
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

export type AjnaErrorWithdrawUndercollateralized = {
  name: 'withdraw-undercollateralized'
  data: {
    amount: string
  }
}

export type AjnaErrorBorrowUndercollateralized = {
  name: 'borrow-undercollateralized'
  data: {
    amount: string
  }
}

export type AjnaErrorDustLimit = {
  name: 'debt-less-then-dust-limit'
  data: {
    amount: string
  }
}

export type AjnaErrorPriceAboveMomp = {
  name: 'price-above-momp'
}

export type AjnaErrorWithdrawMoreThanAvailable = {
  name: 'withdraw-more-than-available'
  data: {
    amount: string
  }
}

export type AjnaErrorNotEnoughLiquidity = {
  name: 'not-enough-liquidity'
  data: {
    amount: string
  }
}

export type AjnaErrorAfterLupIndexBiggerThanHtpIndex = {
  name: 'after-lup-index-bigger-than-htp-index'
}

export type AjnaErrorOverWithdraw = {
  name: 'withdrawing-more-then-available'
  data: {
    amount: string
  }
}

export type AjnaErrorOverRepay = {
  name: 'payback-amount-exceeds-debt-token-balance'
  data: {
    amount: string
  }
}

export type AjnaError =
  | AjnaErrorWithdrawUndercollateralized
  | AjnaErrorBorrowUndercollateralized
  | AjnaErrorPriceAboveMomp
  | AjnaErrorWithdrawMoreThanAvailable
  | AjnaErrorAfterLupIndexBiggerThanHtpIndex
  | AjnaErrorDustLimit
  | AjnaErrorNotEnoughLiquidity
  | AjnaErrorOverWithdraw
  | AjnaErrorOverRepay

export type AjnaWarningPriceBelowHtp = {
  name: 'price-below-htp'
}

export type AjnaWarning = AjnaWarningPriceBelowHtp

