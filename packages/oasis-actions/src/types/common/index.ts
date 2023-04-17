import { ethers } from 'ethers'

export type Address = string

export type Tx = {
  to: Address
  data: string
  value: string
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
  | AjnaWarningPriceBelowHtp
  | AjnaWarningGenerateCloseToMaxLtv
  | AjnaWarningWithdrawCloseToMaxLtv

export type Strategy<Position> = {
  simulation: {
    swaps: []
    // @deprecated - use position
    targetPosition: Position
    position: Position
    errors: AjnaError[]
    warnings: AjnaWarning[]
  }
  tx: Tx
}

export interface AjnaDependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
}

export type AjnaEarnActions = 'open-earn' | 'deposit-earn' | 'withdraw-earn'
