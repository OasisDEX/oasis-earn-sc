import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { negativeToZero, normalizeValue } from '@dma-common/utils/common'
import {
  calculateMaxGenerate,
  getAjnaBorrowOriginationFee,
  getAjnaLiquidationPrice,
  simulatePool,
} from '@dma-library/protocols/ajna'
import { AjnaWarning } from '@dma-library/types/ajna'
import { IRiskRatio, RiskRatio } from '@domain'
import { BigNumber } from 'bignumber.js'

import { AjnaPool } from './ajna-pool'

export interface IAjnaPosition {
  pool: AjnaPool
  owner: Address
  collateralAmount: BigNumber
  debtAmount: BigNumber

  marketPrice: BigNumber
  liquidationPrice: BigNumber
  liquidationPriceT0Np: BigNumber
  liquidationToMarketPrice: BigNumber
  thresholdPrice: BigNumber

  collateralAvailable: BigNumber
  riskRatio: IRiskRatio
  maxRiskRatio: IRiskRatio
  minRiskRatio: IRiskRatio
  buyingPower: BigNumber
  warnings: AjnaWarning[]

  debtAvailable(collateralAmount: BigNumber): BigNumber

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
    public t0NeutralPrice: BigNumber,
  ) {}

  get liquidationPrice() {
    return getAjnaLiquidationPrice({
      pool: this.pool,
      debtAmount: this.debtAmount,
      collateralAmount: this.collateralAmount,
    })
  }

  get liquidationPriceT0Np() {
    return this.t0NeutralPrice.times(this.pool.pendingInflator)
  }

  get marketPrice() {
    return this.collateralPrice.div(this.quotePrice)
  }

  get liquidationToMarketPrice() {
    return this.liquidationPriceT0Np.div(this.marketPrice)
  }

  get thresholdPrice() {
    const thresholdPrice = this.debtAmount.div(this.collateralAmount)

    return normalizeValue(thresholdPrice)
  }

  get collateralAvailable() {
    const collateralAvailable = this.collateralAmount.minus(
      this.debtAmount.div(this.pool.lowestUtilizedPrice),
    )

    return negativeToZero(normalizeValue(collateralAvailable))
  }

  get riskRatio() {
    const loanToValue = this.thresholdPrice.div(this.marketPrice)

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get maxRiskRatio() {
    const loanToValue = this.pool.lowestUtilizedPrice.div(this.marketPrice)
    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get minRiskRatio() {
    const loanToValue = this.pool.poolMinDebtAmount.div(
      this.collateralAmount.times(this.collateralPrice),
    )

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get buyingPower() {
    return this.collateralAmount
      .times(this.collateralPrice)
      .times(this.maxRiskRatio.loanToValue)
      .minus(this.debtAmount.times(this.quotePrice))
  }

  debtAvailable(collateralAmount?: BigNumber) {
    return calculateMaxGenerate(
      this.pool,
      this.debtAmount,
      collateralAmount || this.collateralAmount,
    )
  }

  originationFee(quoteAmount: BigNumber) {
    return getAjnaBorrowOriginationFee({
      interestRate: this.pool.interestRate,
      quoteAmount,
    })
  }

  deposit(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.plus(collateralAmount))
    return new AjnaPosition(
      simulatePool(this.pool, ZERO, this.debtAmount, newCollateralAmount),
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.quotePrice,
      this.t0NeutralPrice,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.minus(collateralAmount))
    return new AjnaPosition(
      simulatePool(this.pool, ZERO, this.debtAmount, newCollateralAmount),
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.quotePrice,
      this.t0NeutralPrice,
    )
  }

  borrow(quoteAmount: BigNumber): AjnaPosition {
    const newDebt = negativeToZero(this.debtAmount.plus(quoteAmount))
    return new AjnaPosition(
      simulatePool(this.pool, quoteAmount, newDebt, this.collateralAmount),
      this.owner,
      this.collateralAmount,
      newDebt,
      this.collateralPrice,
      this.quotePrice,
      this.t0NeutralPrice,
    )
  }

  payback(quoteAmount: BigNumber): AjnaPosition {
    const newDebt = negativeToZero(this.debtAmount.minus(quoteAmount))
    return new AjnaPosition(
      simulatePool(this.pool, quoteAmount.negated(), newDebt, this.collateralAmount),
      this.owner,
      this.collateralAmount,
      newDebt,
      this.collateralPrice,
      this.quotePrice,
      this.t0NeutralPrice,
    )
  }

  close(): AjnaPosition {
    return new AjnaPosition(
      simulatePool(this.pool, this.debtAmount.negated(), ZERO, this.collateralAmount.negated()),
      this.owner,
      ZERO,
      ZERO,
      this.collateralPrice,
      this.quotePrice,
      this.t0NeutralPrice,
    )
  }
}
