import BigNumber from 'bignumber.js'

import { IAjnaEarn, Pool } from '../../types/ajna'
import { Address } from '../../types/common'

export class AjnaEarn implements IAjnaEarn {
  public earlyWithdrawPenalty: BigNumber = new BigNumber(23)
  public fundsLockedUntil: number

  constructor(public pool: Pool, public owner: Address, public quoteTokenAmount: BigNumber) {
    this.fundsLockedUntil = Date.now() + 5 * 60 * 60 * 1000 // MOCK funds locked until 5h from now
  }

  deposit(quoteTokenAmount: BigNumber) {
    return new AjnaEarn(this.pool, this.owner, this.quoteTokenAmount.plus(quoteTokenAmount))
  }

  withdraw(quoteTokenAmount: BigNumber) {
    return new AjnaEarn(this.pool, this.owner, this.quoteTokenAmount.minus(quoteTokenAmount))
  }
}
