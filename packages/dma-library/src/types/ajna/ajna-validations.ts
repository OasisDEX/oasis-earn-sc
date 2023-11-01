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

export type AjnaErrorDustLimitMultiply = {
  name: 'debt-less-then-dust-limit-multiply'
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

export type AjnaErrorAfterLupIndexBiggerThanHtpIndexDeposit = {
  name: 'after-lup-index-bigger-than-htp-index-deposit'
}

export type AjnaErrorAfterLupIndexBiggerThanHtpIndexWithdraw = {
  name: 'after-lup-index-bigger-than-htp-index-withdraw'
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
  | AjnaErrorAfterLupIndexBiggerThanHtpIndexDeposit
  | AjnaErrorAfterLupIndexBiggerThanHtpIndexWithdraw
  | AjnaErrorDustLimit
  | AjnaErrorDustLimitMultiply
  | AjnaErrorNotEnoughLiquidity
  | AjnaErrorOverWithdraw
  | AjnaErrorOverRepay

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

export type AjnaWarning = AjnaWarningGenerateCloseToMaxLtv | AjnaWarningWithdrawCloseToMaxLtv

export type AjnaNoticePriceBelowHtp = {
  name: 'price-below-htp'
}

export type AjnaNotice = AjnaNoticePriceBelowHtp

export type AjnaSuccessPriceBetweenHtpAndLup = {
  name: 'price-between-htp-and-lup'
}

export type AjnaSuccessPriceaboveLup = {
  name: 'price-above-lup'
  data: {
    lup: string
  }
}

export type AjnaSuccess = AjnaSuccessPriceBetweenHtpAndLup | AjnaSuccessPriceaboveLup
