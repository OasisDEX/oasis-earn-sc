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

export interface SupplyPosition {
  owner: Address
  quoteTokenAmount: BigNumber
  marketPrice: BigNumber

  apy: {
    per1d: BigNumber | undefined
    per7d: BigNumber | undefined
    per30d: BigNumber | undefined
    per90d: BigNumber | undefined
    per365d: BigNumber | undefined
  }

  deposit(amount: BigNumber): SupplyPosition
  withdraw(amount: BigNumber): SupplyPosition
  close(): SupplyPosition
}

export class AjnaEarnPosition implements SupplyPosition {
  public earlyWithdrawPenalty: BigNumber = new BigNumber(23)
  public fundsLockedUntil: number
  public price: BigNumber

  constructor(
    public pool: AjnaPool,
    public owner: Address,
    public quoteTokenAmount: BigNumber,
    public collateralTokenAmount: BigNumber,
    public priceIndex: BigNumber | null,
    public collateralPrice: BigNumber,
    public quotePrice: BigNumber,
    public netValue: BigNumber,
    public pnl: {
      withFees: BigNumber
      withoutFees: BigNumber
    },
    public totalEarnings: { withFees: BigNumber; withoutFees: BigNumber },
    public isBucketFrozen: boolean,
  ) {
    this.fundsLockedUntil = Date.now() + 5 * 60 * 60 * 1000 // MOCK funds locked until 5h from now
    this.price = priceIndex ? priceIndexToPrice(priceIndex) : ZERO
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
      per1d: this.getApyPerDays({ amount: this.pool.depositSize, days: 1 }),
      per7d: this.getApyPerDays({ amount: this.pool.depositSize, days: 7 }),
      per30d: this.getApyPerDays({ amount: this.pool.depositSize, days: 30 }),
      per90d: this.getApyPerDays({ amount: this.pool.depositSize, days: 90 }),
      per365: this.getApyPerDays({ amount: this.pool.depositSize, days: 365 }),
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
      this.collateralPrice,
      this.quotePrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      this.isBucketFrozen,
    )
  }

  deposit(quoteTokenAmount: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount.plus(quoteTokenAmount),
      this.collateralTokenAmount,
      this.priceIndex,
      this.collateralPrice,
      this.quotePrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      this.isBucketFrozen,
    )
  }

  withdraw(quoteTokenAmount: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount.minus(quoteTokenAmount),
      this.collateralTokenAmount,
      this.priceIndex,
      this.collateralPrice,
      this.quotePrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      this.isBucketFrozen,
    )
  }

  claimCollateral() {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount,
      ZERO,
      this.priceIndex,
      this.collateralPrice,
      this.quotePrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      this.isBucketFrozen,
    )
  }

  reopen(quoteTokenAmount: BigNumber, priceIndex: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      quoteTokenAmount,
      this.collateralTokenAmount,
      priceIndex,
      this.collateralPrice,
      this.quotePrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      this.isBucketFrozen,
    )
  }

  close() {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      ZERO,
      ZERO,
      null,
      this.collateralPrice,
      this.quotePrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      this.isBucketFrozen,
    )
  }
}

export type AjnaEarnActions = 'open-earn' | 'deposit-earn' | 'withdraw-earn' | 'claim-earn'
