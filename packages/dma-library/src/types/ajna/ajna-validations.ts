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
}

export type AjnaErrorWithdrawMoreThanAvailable = {
  name: 'withdraw-more-than-available'
  data: {
    amount: string
  }
}

export type AjnaErrorWithdrawNotAvailable = {
  name: 'withdraw-not-available'
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

export type AaveLikeErrorTargetLtvExceedsSupplyCap = {
  name: 'target-ltv-exceeds-supply-cap'
  data: {
    cap: string
  }
}

export type AaveLikeErrorTargetLtvExceedsBorrowCap = {
  name: 'target-ltv-exceeds-borrow-cap'
  data: {
    cap: string
  }
}

export type AaveLikeErrorAmountExceedsSupplyCap = {
  name: 'deposit-amount-exceeds-supply-cap'
  data: {
    cap: string
  }
}

export type AaveLikeErrorAmountExceedsBorrowCap = {
  name: 'debt-amount-exceeds-borrow-cap'
  data: {
    cap: string
  }
}

export type StrategyError =
  | AjnaErrorWithdrawUndercollateralized
  | AjnaErrorBorrowUndercollateralized
  | AjnaErrorWithdrawMoreThanAvailable
  | AjnaErrorWithdrawNotAvailable
  | AjnaErrorAfterLupIndexBiggerThanHtpIndexDeposit
  | AjnaErrorAfterLupIndexBiggerThanHtpIndexWithdraw
  | AjnaErrorDustLimit
  | AjnaErrorDustLimitMultiply
  | AjnaErrorNotEnoughLiquidity
  | AjnaErrorOverWithdraw
  | AaveLikeErrorTargetLtvExceedsSupplyCap
  | AaveLikeErrorTargetLtvExceedsBorrowCap
  | AaveLikeErrorAmountExceedsSupplyCap
  | AaveLikeErrorAmountExceedsBorrowCap

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

type AjnaWarningLiquidationPriceCloseToMarketPrice = {
  name: 'liquidation-price-close-to-market-price'
}

type AaveLikeWarningYieldLoopCloseToLiquidation = {
  name: 'yield-loop-close-to-liquidation'
  data: {
    rangeToLiquidation: string
    liquidationPenalty: string
  }
}

export type StrategyWarning =
  | AjnaWarningGenerateCloseToMaxLtv
  | AjnaWarningWithdrawCloseToMaxLtv
  | AjnaWarningLiquidationPriceCloseToMarketPrice
  | AaveLikeWarningYieldLoopCloseToLiquidation

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

type AaveLikeSuccessYieldLoopSafeFromLiquidation = {
  name: 'yield-loop-safe-from-liquidation'
  data: {
    rangeToLiquidation: string
    liquidationPenalty: string
  }
}

export type AjnaSuccess =
  | AjnaSuccessPriceBetweenHtpAndLup
  | AjnaSuccessPriceaboveLup
  | AaveLikeSuccessYieldLoopSafeFromLiquidation
