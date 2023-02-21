import BigNumber from 'bignumber.js'

import { IAjnaPosition, Pool } from '../../types/ajna'
import { Address, AjnaError } from '../../types/common'
import { IRiskRatio, RiskRatio } from '../calculations'
import { ZERO } from '../constants'

export class AjnaPosition implements IAjnaPosition {
  riskRatio: IRiskRatio
  collateralAvailable: BigNumber = new BigNumber(0)
  debtAvailable: BigNumber = new BigNumber(0)

  constructor(
    public pool: Pool,
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
  ) {
    if (collateralAmount.times(pool.lup).eq(ZERO)) {
      this.riskRatio = new RiskRatio(ZERO, RiskRatio.TYPE.LTV)
    } else {
      this.riskRatio = new RiskRatio(
        debtAmount.div(collateralAmount.times(pool.lup)),
        RiskRatio.TYPE.LTV,
      )
    }
  }

  get liquidationPrice() {
    return new BigNumber(0)
  }

  get thresholdPrice() {
    if (this.collateralAmount.eq(0)) {
      return ZERO
    }
    return this.debtAmount.div(this.collateralAmount)
  }

  get errors(): AjnaError[] {
    const errors: AjnaError[] = []
    if (this.thresholdPrice.gt(this.pool.lup)) {
      errors.push({
        name: 'undercollateralized',
        data: {
          positionRatio: this.riskRatio.loanToValue.toString(),
          minRatio: '---',
        },
      })
    }

    return errors
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
