import { BigNumber } from 'bignumber.js'

import { IRiskRatio, RiskRatio } from '../../domain'
import { ONE } from '../../helpers/constants'
import { normalizeValue } from '../../helpers/normalizeValue'
import { Address, AjnaError, AjnaWarning } from '../common'
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
  warnings: AjnaWarning[]

  deposit(amount: BigNumber): IAjnaPosition
  withdraw(amount: BigNumber): IAjnaPosition
  borrow(amount: BigNumber): IAjnaPosition
  payback(amount: BigNumber): IAjnaPosition
}

export class AjnaPosition implements IAjnaPosition {
  errors: AjnaError[] = []
  warnings: AjnaWarning[] = []

  constructor(
    public pool: AjnaPool,
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
    public collateralPrice: BigNumber,
    public quotePrice: BigNumber,
  ) {}

  get liquidationPrice() {
    const liquidationPrice = this.pool.mostOptimisticMatchingPrice
      .times(
        this.debtAmount
          .div(this.pool.pendingInflator)
          .times(this.pool.pendingInflator)
          .div(this.pool.lowestUtilizedPrice.times(this.collateralAmount)),
      )
      .times(ONE.plus(this.pool.interestRate))

    return normalizeValue(liquidationPrice)
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
      this.debtAmount.div(this.pool.lowestUtilizedPrice),
    )

    return normalizeValue(collateralAvailable)
  }

  get debtAvailable() {
    const debtAvailable = this.collateralAmount
      .times(this.pool.lowestUtilizedPrice)
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
