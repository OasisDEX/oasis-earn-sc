import BigNumber from 'bignumber.js'

import { IAjnaEarn, Pool } from '../../types/ajna'
import { Address } from '../../types/common'

function priceIndexToPrice(priceIndex: BigNumber) {
  return new BigNumber(1.05).pow(priceIndex.minus(3232))
}

export class AjnaEarn implements IAjnaEarn {
  public earlyWithdrawPenalty: BigNumber = new BigNumber(23)
  public fundsLockedUntil: number
  public price: BigNumber

  constructor(
    public pool: Pool,
    public owner: Address,
    public quoteTokenAmount: BigNumber,
    public priceIndex: BigNumber,
  ) {
    this.fundsLockedUntil = Date.now() + 5 * 60 * 60 * 1000 // MOCK funds locked until 5h from now
    this.price = priceIndexToPrice(priceIndex)
  }

  get isEarningFees() {
    return this.pool.htp.lt(this.price)
  }

  moveQuote(newPriceIndex: BigNumber) {
    return new AjnaEarn(this.pool, this.owner, this.quoteTokenAmount, newPriceIndex)
  }

  deposit(quoteTokenAmount: BigNumber) {
    return new AjnaEarn(
      this.pool,
      this.owner,
      this.quoteTokenAmount.plus(quoteTokenAmount),
      this.priceIndex,
    )
  }

  withdraw(quoteTokenAmount: BigNumber) {
    return new AjnaEarn(
      this.pool,
      this.owner,
      this.quoteTokenAmount.minus(quoteTokenAmount),
      this.priceIndex,
    )
  }
}
