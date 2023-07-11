import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { normalizeValue } from '@dma-common/utils/common'
import { calculateAjnaApyPerDays } from '@dma-library/protocols/ajna'
import bucketPrices from '@dma-library/strategies/ajna/earn/buckets.json'
import { RiskRatio } from '@domain'
import BigNumber from 'bignumber.js'

import { AjnaPool } from './ajna-pool'

function priceIndexToPrice(priceIndex: BigNumber) {
  return new BigNumber(bucketPrices[priceIndex.toNumber()]).shiftedBy(-18)
}

export interface IAjnaEarn {
  pool: AjnaPool
  owner: Address
  quoteTokenAmount: BigNumber
  collateralTokenAmount: BigNumber
  price: BigNumber
  priceIndex: BigNumber | null
  marketPrice: BigNumber

  isEarningFees: boolean

  getApyPerDays: (params: { amount?: BigNumber; days: number }) => BigNumber | undefined

  fundsLockedUntil: number
  earlyWithdrawPenalty: BigNumber

  stakedNftId: string | null

  deposit(amount: BigNumber): IAjnaEarn
  withdraw(amount: BigNumber): IAjnaEarn
  claimCollateral(): IAjnaEarn
  close(): IAjnaEarn
}

export class AjnaEarnPosition implements IAjnaEarn {
  public earlyWithdrawPenalty: BigNumber = new BigNumber(23)
  public fundsLockedUntil: number
  public price: BigNumber
  public stakedNftId: string | null = null

  constructor(
    public pool: AjnaPool,
    public owner: Address,
    public quoteTokenAmount: BigNumber,
    public collateralTokenAmount: BigNumber,
    public priceIndex: BigNumber | null,
    public nftId: string | null = null,
    public collateralPrice: BigNumber,
    public quotePrice: BigNumber,
    public rewards: BigNumber,
    public netValue: BigNumber,
    public pnl: BigNumber,
    public totalEarnings: BigNumber,
  ) {
    this.fundsLockedUntil = Date.now() + 5 * 60 * 60 * 1000 // MOCK funds locked until 5h from now
    this.price = priceIndex ? priceIndexToPrice(priceIndex) : ZERO
    this.stakedNftId = nftId
    this.collateralTokenAmount = collateralTokenAmount
  }

  get isEarningFees() {
    if (!this.priceIndex) {
      return false
    }
    return this.pool.htp.lt(this.price)
  }

  get marketPrice() {
    return this.collateralPrice.div(this.quotePrice)
  }
  get getFeeWhenBelowLup() {
    return this.price.lt(this.pool.lowestUtilizedPrice) && this.apy.per1d
      ? this.apy.per1d.times(this.quoteTokenAmount)
      : ZERO
  }

  get apy() {
    return {
      per1d: this.getApyPerDays({ amount: this.quoteTokenAmount, days: 1 }),
      per7d: this.getApyPerDays({ amount: this.quoteTokenAmount, days: 7 }),
      per30d: this.getApyPerDays({ amount: this.quoteTokenAmount, days: 30 }),
      per90d: this.getApyPerDays({ amount: this.quoteTokenAmount, days: 90 }),
      per365d: this.getApyPerDays({ amount: this.quoteTokenAmount, days: 365 }),
    }
  }

  get poolApy() {
    return {
      per7d: this.getApyPerDays({ amount: this.pool.depositSize, days: 7 }),
      per90d: this.getApyPerDays({ amount: this.pool.depositSize, days: 90 }),
    }
  }

  get maxRiskRatio() {
    const loanToValue = this.price.div(this.marketPrice)

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  getMaxLtv(price?: BigNumber) {
    return price?.div(this.collateralPrice.div(this.quotePrice)) || ZERO
  }

  getApyPerDays({ amount, days }: { amount?: BigNumber; days: number }) {
    return amount?.gt(0) && this.pool.dailyPercentageRate30dAverage.gt(0)
      ? calculateAjnaApyPerDays(amount, this.pool.dailyPercentageRate30dAverage, days)
      : undefined
  }

  getBreakEven(openPositionGasFee: BigNumber) {
    const apy1Day = this.isEarningFees
      ? this.getApyPerDays({ amount: this.quoteTokenAmount, days: 1 })
      : ZERO
    const openPositionFees = this.getFeeWhenBelowLup.plus(openPositionGasFee)

    if (!apy1Day || apy1Day.isZero() || !this.quoteTokenAmount) return undefined

    return (
      Math.log(this.quoteTokenAmount.plus(openPositionFees).div(this.quoteTokenAmount).toNumber()) /
      apy1Day.toNumber()
    )
  }

  moveQuote(newPriceIndex: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount,
      this.collateralTokenAmount,
      newPriceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }

  deposit(quoteTokenAmount: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount.plus(quoteTokenAmount),
      this.collateralTokenAmount,
      this.priceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }

  withdraw(quoteTokenAmount: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount.minus(quoteTokenAmount),
      this.collateralTokenAmount,
      this.priceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }

  claimCollateral() {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount,
      ZERO,
      this.priceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }

  reopen(quoteTokenAmount: BigNumber, priceIndex: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      quoteTokenAmount,
      this.collateralTokenAmount,
      priceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }

  close() {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      ZERO,
      ZERO,
      null,
      null,
      this.collateralPrice,
      this.quotePrice,
      ZERO,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }
}

export type AjnaEarnActions = 'open-earn' | 'deposit-earn' | 'withdraw-earn' | 'claim-earn'
