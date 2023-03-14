import BigNumber from 'bignumber.js'

import { ZERO } from '../../helpers/constants'
import bucketPrices from '../../strategies/ajna/earn/buckets.json'
import { Address } from '../common'
import { AjnaPool } from './AjnaPool'

function priceIndexToPrice(priceIndex: BigNumber) {
  return new BigNumber(bucketPrices[priceIndex.toNumber()]).shiftedBy(-18)
}

export interface IAjnaEarn {
  pool: AjnaPool
  owner: Address
  quoteTokenAmount: BigNumber
  price: BigNumber
  priceIndex: BigNumber | null

  isEarningFees: boolean

  fundsLockedUntil: number
  earlyWithdrawPenalty: BigNumber

  stakedNftId: string | null

  deposit(amount: BigNumber): IAjnaEarn
  withdraw(amount: BigNumber): IAjnaEarn
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
  ) {
    this.fundsLockedUntil = Date.now() + 5 * 60 * 60 * 1000 // MOCK funds locked until 5h from now
    this.price = priceIndex ? priceIndexToPrice(priceIndex) : ZERO
  }

  get isEarningFees() {
    if (!this.priceIndex) {
      return false
    }
    return this.pool.htp.lt(this.price)
  }

  moveQuote(newPriceIndex: BigNumber) {
    return new AjnaEarnPosition(this.pool, this.owner, this.quoteTokenAmount, newPriceIndex)
  }

  deposit(quoteTokenAmount: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount.plus(quoteTokenAmount),
      this.priceIndex,
    )
  }

  withdraw(quoteTokenAmount: BigNumber) {
    return new AjnaEarnPosition(
      this.pool,
      this.owner,
      this.quoteTokenAmount.minus(quoteTokenAmount),
      this.priceIndex,
    )
  }
}
