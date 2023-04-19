import { ZERO } from '@oasisdex/dma-common/constants'
import { Address } from '@oasisdex/dma-deployments/types/address'
import { IRiskRatio, RiskRatio } from '@oasisdex/domain/src'
import { BigNumber } from 'bignumber.js'

import { AjnaError } from '../common'
import { AjnaPool } from './ajna-pool'

export interface IAjnaPosition {
  pool: AjnaPool
  owner: Address
  collateralAmount: BigNumber
  debtAmount: BigNumber

  liquidationPrice: BigNumber
  thresholdPrice: BigNumber
  errors: AjnaError[]

  collateralAvailable: BigNumber
  debtAvailable: BigNumber

  riskRatio: IRiskRatio

  deposit(amount: BigNumber): IAjnaPosition
  withdraw(amount: BigNumber): IAjnaPosition
  borrow(amount: BigNumber): IAjnaPosition
  payback(amount: BigNumber): IAjnaPosition
}

export class AjnaPosition implements IAjnaPosition {
  riskRatio: IRiskRatio
  collateralAvailable: BigNumber = new BigNumber(0)
  debtAvailable: BigNumber = new BigNumber(0)

  constructor(
    public pool: AjnaPool,
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
