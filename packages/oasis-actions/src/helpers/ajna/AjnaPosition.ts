import BigNumber from 'bignumber.js'

import { IRiskRatio, RiskRatio } from '@/helpers/calculations'
import { IAjnaPosition, Pool } from '@/types/ajna'
import { Address } from '@/types/common'

export class AjnaPosition implements IAjnaPosition {
  riskRatio: IRiskRatio

  constructor(
    public pool: Pool,
    public owner: Address,
    public collateralAmount: BigNumber,
    public collateralPrecision: number,
    public debtAmount: BigNumber,
    public debtPrecision: number,
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
      this.collateralPrecision,
      this.debtAmount,
      this.debtPrecision,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount.minus(collateralAmount),
      this.collateralPrecision,
      this.debtAmount,
      this.debtPrecision,
    )
  }

  borrow(quoteAmount: BigNumber): AjnaPosition {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount,
      this.collateralPrecision,
      this.debtAmount.plus(quoteAmount),
      this.debtPrecision,
    )
  }

  payback(quoteAmount: BigNumber): AjnaPosition {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount,
      this.collateralPrecision,
      this.debtAmount.minus(quoteAmount),
      this.debtPrecision,
    )
  }
}
