import { Address } from '@deploy-configurations/types/address'
import { Tx } from '@dma-common/types'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

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

export type AjnaWarningPriceBelowHtp = {
  name: 'price-below-htp'
}

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
  | AjnaWarningPriceBelowHtp
  | AjnaWarningGenerateCloseToMaxLtv
  | AjnaWarningWithdrawCloseToMaxLtv
  | AjnaWarningPriceAboveMomp

export interface Swap {
  fromTokenAddress: Address
  toTokenAddress: Address
  fromTokenAmount: BigNumber
  toTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  exchangeCalldata: string | number
  collectFeeFrom: Address
  fee: BigNumber
}

export type Strategy<Position> = {
  simulation: {
    swaps: Swap[]
    /** @deprecated - use position */
    targetPosition: Position
    position: Position
  }
  tx: Tx
}

export type AjnaStrategy<Position> = Strategy<Position> & {
  simulation: Strategy<Position>['simulation'] & {
    errors: AjnaError[]
    warnings: AjnaWarning[]
  }
}

export interface AjnaDependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
}

export type AjnaDMADependencies = Omit<AjnaDependencies, 'ajnaProxyActions'> & {
  operationExecutor: Address
}

export type AjnaEarnActions = 'open-earn' | 'deposit-earn' | 'withdraw-earn' | 'claim-earn'

export enum FlashloanProvider {
  DssFlash = 0,
  Balancer = 1,
}
