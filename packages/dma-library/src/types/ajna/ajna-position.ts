import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { negativeToZero, normalizeValue } from '@dma-common/utils/common'
import {
  ajnaCollateralizationFactor,
  calculateMaxGenerate,
  getAjnaBorrowOriginationFee,
  getNeutralPrice,
  simulatePool,
} from '@dma-library/protocols/ajna'
import { AjnaWarning } from '@dma-library/types/ajna'
import { AjnaCumulativesData } from '@dma-library/views/ajna'
import { getBuyingPower } from '@dma-library/views/common'
import { IRiskRatio, RiskRatio } from '@domain'
import { BigNumber } from 'bignumber.js'

import { AjnaPool } from './ajna-pool'

export interface LendingPosition {
  owner: Address
  collateralAmount: BigNumber
  debtAmount: BigNumber

  marketPrice: BigNumber
  liquidationPrice: BigNumber
  liquidationToMarketPrice: BigNumber

  collateralAvailable: BigNumber
  riskRatio: IRiskRatio
  maxRiskRatio: IRiskRatio
  minRiskRatio: IRiskRatio

  borrowRate: BigNumber
  netValue: BigNumber
  buyingPower: BigNumber
  pnl: {
    withFees: BigNumber
    withoutFees: BigNumber
  }

  debtAvailable(collateralAmount?: BigNumber): BigNumber

  deposit(amount: BigNumber): LendingPosition

  withdraw(amount: BigNumber): LendingPosition

  borrow(amount: BigNumber): LendingPosition

  payback(amount: BigNumber): LendingPosition
}

export class AjnaPosition implements LendingPosition {
  warnings: AjnaWarning[] = []

  constructor(
    public pool: AjnaPool,
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
    public collateralPrice: BigNumber,
    public quotePrice: BigNumber,
    public t0NeutralPrice: BigNumber,
    public pnl: {
      withFees: BigNumber
      withoutFees: BigNumber
      cumulatives: AjnaCumulativesData
    },
  ) {}

  get liquidationPrice() {
    return this.t0NeutralPrice.times(this.pool.pendingInflator)
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
      this.debtAmount.times(ajnaCollateralizationFactor).div(this.pool.lowestUtilizedPrice),
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

  get borrowRate(): BigNumber {
    return this.pool.borrowApr
  }

  get netValue(): BigNumber {
    return this.collateralAmount
      .times(this.collateralPrice)
      .minus(this.debtAmount.times(this.quotePrice))
  }

  get minRiskRatio() {
    const loanToValue = this.pool.loansCount.gt(10)
      ? this.pool.poolMinDebtAmount.div(this.collateralAmount.times(this.collateralPrice))
      : ZERO

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get buyingPower() {
    return getBuyingPower({
      netValue: this.netValue,
      collateralPrice: this.collateralPrice,
      marketPrice: this.marketPrice,
      debtAmount: this.debtAmount,
      maxRiskRatio: this.maxRiskRatio,
    })
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
      getNeutralPrice(
        this.debtAmount,
        newCollateralAmount,
        this.pool.interestRate,
        this.t0NeutralPrice,
        this.thresholdPrice,
        false,
        false,
      ),
      this.pnl,
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
      getNeutralPrice(
        this.debtAmount,
        newCollateralAmount,
        this.pool.interestRate,
        this.t0NeutralPrice,
        this.thresholdPrice,
        false,
        this.collateralAmount.gt(newCollateralAmount),
      ),
      this.pnl,
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
      getNeutralPrice(
        newDebt,
        this.collateralAmount,
        this.pool.interestRate,
        this.t0NeutralPrice,
        this.thresholdPrice,
        this.debtAmount.lt(newDebt),
        false,
      ),
      this.pnl,
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
      getNeutralPrice(
        newDebt,
        this.collateralAmount,
        this.pool.interestRate,
        this.t0NeutralPrice,
        this.thresholdPrice,
        false,
        false,
      ),
      this.pnl,
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
      getNeutralPrice(
        ZERO,
        ZERO,
        this.pool.interestRate,
        this.t0NeutralPrice,
        this.thresholdPrice,
        false,
        true,
      ),
      this.pnl,
    )
  }
}
