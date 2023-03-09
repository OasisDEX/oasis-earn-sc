import { BigNumber } from 'bignumber.js'

import { IRiskRatio, RiskRatio } from '../../domain'
import { ZERO } from '../../helpers/constants'
import { normalizeValue } from '../../helpers/normalizeValue'
import { Address, AjnaError } from '../common'
import { AjnaPool } from './AjnaPool'

export interface IAjnaPosition {
  pool: AjnaPool
  owner: Address
  collateralAmount: BigNumber
  debtAmount: BigNumber

  marketPrice: BigNumber
  liquidationPrice: BigNumber
  thresholdPrice: BigNumber

  collateralAvailable: BigNumber
  debtAvailable: BigNumber

  riskRatio: IRiskRatio
  maxRiskRatio: IRiskRatio

  errors: AjnaError[]

  deposit(amount: BigNumber): IAjnaPosition
  withdraw(amount: BigNumber): IAjnaPosition
  borrow(amount: BigNumber): IAjnaPosition
  payback(amount: BigNumber): IAjnaPosition
}

export class AjnaPosition implements IAjnaPosition {
  constructor(
    public pool: AjnaPool,
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
    public collateralPrice: BigNumber,
    public quotePrice: BigNumber,
  ) {}

  get liquidationPrice() {
    return ZERO
  }

  get marketPrice() {
    return this.collateralPrice.div(this.quotePrice)
  }

  get thresholdPrice() {
    const thresholdPrice = this.debtAmount.div(this.collateralAmount)

    return normalizeValue(thresholdPrice)
  }

  get collateralAvailable() {
    const collateralAvailable = this.collateralAmount.minus(
      this.debtAmount.div(this.marketPrice.times(this.maxRiskRatio.loanToValue)),
    )

    return normalizeValue(collateralAvailable)
  }

  get debtAvailable() {
    const debtAvailable = this.marketPrice
      .times(this.maxRiskRatio.loanToValue)
      .times(this.collateralAmount)
      .minus(this.debtAmount)

    return normalizeValue(debtAvailable)
  }

  get riskRatio() {
    const loanToValue = this.thresholdPrice.div(this.marketPrice)

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get maxRiskRatio() {
    const loanToValue = this.pool.lowestUtilizedPrice.div(this.marketPrice)

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
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
      this.collateralPrice,
      this.quotePrice,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount.minus(collateralAmount),
      this.debtAmount,
      this.collateralPrice,
      this.quotePrice,
    )
  }

  borrow(quoteAmount: BigNumber): AjnaPosition {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount,
      this.debtAmount.plus(quoteAmount),
      this.collateralPrice,
      this.quotePrice,
    )
  }

  payback(quoteAmount: BigNumber): AjnaPosition {
    return new AjnaPosition(
      this.pool,
      this.owner,
      this.collateralAmount,
      this.debtAmount.minus(quoteAmount),
      this.collateralPrice,
      this.quotePrice,
    )
  }
}
