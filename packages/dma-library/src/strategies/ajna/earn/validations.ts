import {
  validateLupBelowHtp,
  validatePriceAboveLup,
  validatePriceBelowHtp,
  validatePriceBetweenHtpAndLup,
  validateWithdrawMoreThanAvailable,
} from '@dma-library/strategies/ajna/validation'
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
  action,
  afterLupIndex,
}: {
  price: BigNumber
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  position: AjnaEarnPosition
  simulation: AjnaEarnPosition
  action: AjnaEarnActions
  afterLupIndex?: BigNumber
}) => {
  const errors: AjnaError[] = []
  const warnings: AjnaWarning[] = []
  const notices: AjnaNotice[] = []
  const successes: AjnaSuccess[] = []

  // common
  notices.push(...validatePriceBelowHtp(position, price))
  successes.push(
    ...validatePriceBetweenHtpAndLup(position, price),
    ...validatePriceAboveLup(position, price),
  )

  // action specific
  switch (action) {
    case 'open-earn':
    case 'claim-earn': {
      break
    }
    case 'deposit-earn': {
      errors.push(...validateLupBelowHtp(position, action, afterLupIndex))
      break
    }
    case 'withdraw-earn': {
      errors.push(
        ...validateLupBelowHtp(position, action, afterLupIndex),
        ...validateWithdrawMoreThanAvailable(position, quoteAmount, quoteTokenPrecision),
      )
      break
    }
    default:
      break
  }

  return { errors, warnings, notices, successes }
}
