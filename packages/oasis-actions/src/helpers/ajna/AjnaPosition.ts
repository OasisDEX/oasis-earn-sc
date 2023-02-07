import BigNumber from 'bignumber.js'

import { IAjnaPosition, Pool } from '../../types/ajna'
import { Address } from '../../types/common'
import { IRiskRatio, RiskRatio } from '../calculations/RiskRatio'

export class AjnaPosition implements IAjnaPosition {
  riskRatio: IRiskRatio

  constructor(
    public pool: Pool,
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
  ) {
    this.riskRatio = new RiskRatio(
      debtAmount.div(collateralAmount.times(pool.lup)),
      RiskRatio.TYPE.LTV,
    )
  }

  get liquidationPrice() {
    return new BigNumber(0)
  }

  deposit(collateralAmount: BigNumber) {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount.plus(collateralAmount),
      this.debtAmount,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount.minus(collateralAmount),
      this.debtAmount,
    )
  }

  borrow(quoteAmount: BigNumber): AjnaPosition {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount,
      this.debtAmount.plus(quoteAmount),
    )
  }

  payback(quoteAmount: BigNumber): AjnaPosition {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount,
      this.debtAmount.minus(quoteAmount),
    )
  }
}
