import BigNumber from 'bignumber.js'

import { RiskRatio } from '@oasisdex/domain'
import { ZERO } from '@oasisdex/dma-common/constants'
import { normalizeValue } from '@oasisdex/dma-common/utils/common'
import bucketPrices from './buckets.json'
import { Address } from '@oasisdex/dma-common/types/address'
import { AjnaPool } from './ajna-pool'
import { calculateAjnaApyPerDays } from './earn'

function priceIndexToPrice(priceIndex: BigNumber) {
  return new BigNumber(bucketPrices[priceIndex.toNumber()]).shiftedBy(-18)
}

export interface IAjnaEarn {
  pool: AjnaPool
  owner: Address
  quoteTokenAmount: BigNumber
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
    public priceIndex: BigNumber | null,
    public nftId: string | null = null,
    public collateralPrice: BigNumber,
    public quotePrice: BigNumber,
    public rewards: BigNumber,
  ) {
    this.fundsLockedUntil = Date.now() + 5 * 60 * 60 * 1000 // MOCK funds locked until 5h from now
    this.price = priceIndex ? priceIndexToPrice(priceIndex) : ZERO
    this.stakedNftId = nftId
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
  // TODO here we will need also verify lup change due to quote deposit
  get getFeeWhenBelowLup() {
    return this.price.lt(this.pool.lowestUtilizedPrice)
      ? this.pool.interestRate.div(365).times(this.quoteTokenAmount).times(this.quotePrice)
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
    return amount?.gt(0) && this.pool
      ? calculateAjnaApyPerDays(amount, this.pool.dailyPercentageRate30dAverage, days)
      : undefined
  }

  getBreakEven(openPositionGasFee: BigNumber) {
    const apy1Day = this.getApyPerDays({ amount: this.quoteTokenAmount, days: 1 })
    const openPositionFees = this.getFeeWhenBelowLup.plus(openPositionGasFee)

    if (!apy1Day || !this.quoteTokenAmount) return undefined

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
      newPriceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
    )
  }

  deposit(quoteTokenAmount: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount.plus(quoteTokenAmount),
      this.priceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
    )
  }

  withdraw(quoteTokenAmount: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount.minus(quoteTokenAmount),
      this.priceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
    )
  }

  reopen(quoteTokenAmount: BigNumber, priceIndex: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      quoteTokenAmount,
      priceIndex,
      this.stakedNftId,
      this.collateralPrice,
      this.quotePrice,
      this.rewards,
    )
  }

  close() {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      ZERO,
      null,
      null,
      this.collateralPrice,
      this.quotePrice,
      ZERO,
    )
  }
}
