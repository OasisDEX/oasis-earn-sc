import { ethers } from 'ethers'

export type Address = string

export type Tx = {
  to: Address
  data: string
  value: string
}

export type AjnaErrorUndercollateralized = {
  name: 'undercollateralized'
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
  name: 'repay-more-then-debt'
  data: {
    amount: string
  }
}

export type AjnaError =
  | AjnaErrorUndercollateralized
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
