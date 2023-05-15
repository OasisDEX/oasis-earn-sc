import { Address } from '@deploy-configurations/types/address'
import { ONE, ZERO } from '@dma-common/constants'
import { negativeToZero, normalizeValue } from '@dma-common/utils/common'
import { calculateMaxGenerate, simulatePool } from '@dma-library/protocols/ajna'
import { AjnaWarning } from '@dma-library/types/common'
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
  liquidationToMarketPrice: BigNumber
  thresholdPrice: BigNumber

  collateralAvailable: BigNumber
  riskRatio: IRiskRatio
  maxRiskRatio: IRiskRatio
  warnings: AjnaWarning[]

  debtAvailable(collateralAmount: BigNumber): BigNumber

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

  debtAvailable(collateralAmount?: BigNumber) {
    return calculateMaxGenerate(
      this.pool,
      this.debtAmount,
      collateralAmount || this.collateralAmount,
    )
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
    )
  }
}
