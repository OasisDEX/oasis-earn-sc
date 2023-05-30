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
    minDebtAmount: string
  }
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
  | AjnaErrorWithdrawMoreThanAvailable
  | AjnaErrorAfterLupIndexBiggerThanHtpIndex
  | AjnaErrorDustLimit
  | AjnaErrorNotEnoughLiquidity
  | AjnaErrorOverWithdraw
  | AjnaErrorOverRepay

export type AjnaWarningPriceAboveMomp = {
  name: 'price-above-momp'
}

type AjnaWarningGenerateCloseToMaxLtv = {
  name: 'generate-close-to-max-ltv'
  data: {
    amount: string
  }
}

type AjnaWarningWithdrawCloseToMaxLtv = {
  name: 'withdraw-close-to-max-ltv'
  data: {
    amount: string
  }
}

export type AjnaWarning =
  | AjnaWarningGenerateCloseToMaxLtv
  | AjnaWarningWithdrawCloseToMaxLtv
  | AjnaWarningPriceAboveMomp

export type AjnaNoticePriceBelowHtp = {
  name: 'price-below-htp'
}

export type AjnaNotice = AjnaNoticePriceBelowHtp

export type AjnaSuccessPriceInYieldZone = {
  name: 'price-in-yield-zone'
}

export type AjnaSuccess = AjnaSuccessPriceInYieldZone
