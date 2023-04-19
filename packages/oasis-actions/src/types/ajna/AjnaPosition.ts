import BigNumber from 'bignumber.js'

import { IRiskRatio, RiskRatio } from '../../domain'
import { getAjnaBorrowOriginationFee } from '../../helpers/ajna'
import { ONE, ZERO } from '../../helpers/constants'
import { normalizeValue } from '../../helpers/normalizeValue'
import { simulatePool } from '../../views/ajna'
import { Address, AjnaWarning } from '../common'
import { AjnaPool } from './AjnaPool'

export interface IAjnaPosition {
  pool: AjnaPool
  owner: Address
  collateralAmount: BigNumber
  debtAmount: BigNumber

  marketPrice: BigNumber
  liquidationPrice: BigNumber
  liquidationToMarketPrice: BigNumber
  thresholdPrice: BigNumber

  collateralAvailable: BigNumber
  debtAvailable: BigNumber

  riskRatio: IRiskRatio
  maxRiskRatio: IRiskRatio

  warnings: AjnaWarning[]

  originationFee(amount: BigNumber): BigNumber
  deposit(amount: BigNumber): IAjnaPosition
  withdraw(amount: BigNumber): IAjnaPosition
  borrow(amount: BigNumber): IAjnaPosition
  payback(amount: BigNumber): IAjnaPosition
}

export class AjnaPosition implements IAjnaPosition {
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
      .times(this.debtAmount.div(this.pool.lowestUtilizedPrice.times(this.collateralAmount)))
      .times(ONE.plus(this.pool.interestRate))

    return normalizeValue(liquidationPrice)
  }

  get marketPrice() {
    return this.collateralPrice.div(this.quotePrice)
  }

  get liquidationToMarketPrice() {
    return this.liquidationPrice.div(this.marketPrice)
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

  originationFee(quoteAmount: BigNumber) {
    return getAjnaBorrowOriginationFee({
      interestRate: this.pool.interestRate,
      quoteAmount,
    })
  }

  deposit(collateralAmount: BigNumber) {
    const newCollateralAmount = this.collateralAmount.plus(collateralAmount)
    return new AjnaPosition(
      simulatePool(this.pool, ZERO, this.debtAmount, newCollateralAmount),
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.quotePrice,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    const newCollateralAmount = this.collateralAmount.minus(collateralAmount)
    return new AjnaPosition(
      simulatePool(this.pool, ZERO, this.debtAmount, newCollateralAmount),
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.quotePrice,
    )
  }

  borrow(quoteAmount: BigNumber): AjnaPosition {
    const originationFee = this.originationFee(quoteAmount)
    const newDebt = this.debtAmount.plus(quoteAmount).plus(originationFee)
    return new AjnaPosition(
      simulatePool(this.pool, quoteAmount, newDebt, this.collateralAmount),
      this.owner,
      this.collateralAmount,
      newDebt,
      this.collateralPrice,
      this.quotePrice,
    )
  }

  payback(quoteAmount: BigNumber): AjnaPosition {
    const newDebt = this.debtAmount.minus(quoteAmount)
    return new AjnaPosition(
      simulatePool(this.pool, quoteAmount.negated(), newDebt, this.collateralAmount),
      this.owner,
      this.collateralAmount,
      newDebt,
      this.collateralPrice,
      this.quotePrice,
    )
  }
}
