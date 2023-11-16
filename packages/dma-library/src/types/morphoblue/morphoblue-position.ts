import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { negativeToZero, normalizeValue } from '@dma-common/utils/common'
import { IRiskRatio, RiskRatio } from '@domain'
import { BigNumber } from 'bignumber.js'

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

export class MorphoBluePosition implements LendingPosition {
  constructor(
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
    public collateralPrice: BigNumber,
    public quotePrice: BigNumber,
    public pnl: {
      withFees: BigNumber
      withoutFees: BigNumber
    },
  ) {}

  get liquidationPrice() {
    return new BigNumber(1234)
  }

  get marketPrice() {
    return this.collateralPrice.div(this.quotePrice)
  }

  get liquidationToMarketPrice() {
    return this.liquidationPrice.div(this.marketPrice)
  }

  get collateralAvailable() {
    const collateralAvailable = ZERO

    return negativeToZero(normalizeValue(collateralAvailable))
  }

  get riskRatio() {
    const loanToValue = this.debtAmount
      .times(this.quotePrice)
      .div(this.collateralAmount.times(this.collateralPrice))

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get maxRiskRatio() {
    const loanToValue = new BigNumber(0.85)
    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get borrowRate(): BigNumber {
    return ZERO
  }

  get netValue(): BigNumber {
    return this.collateralAmount
      .times(this.collateralPrice)
      .minus(this.debtAmount.times(this.quotePrice))
  }

  get minRiskRatio() {
    const loanToValue = ZERO

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get buyingPower() {
    return this.collateralAmount
      .times(this.collateralPrice)
      .times(this.maxRiskRatio.loanToValue)
      .minus(this.debtAmount.times(this.quotePrice))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debtAvailable(collateralAmount?: BigNumber) {
    return ZERO
  }

  deposit(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.plus(collateralAmount))
    return new MorphoBluePosition(
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.quotePrice,
      this.pnl,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.minus(collateralAmount))
    return new MorphoBluePosition(
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.quotePrice,
      this.pnl,
    )
  }

  borrow(quoteAmount: BigNumber): MorphoBluePosition {
    const newDebt = negativeToZero(this.debtAmount.plus(quoteAmount))
    return new MorphoBluePosition(
      this.owner,
      this.collateralAmount,
      newDebt,
      this.collateralPrice,
      this.quotePrice,
      this.pnl,
    )
  }

  payback(quoteAmount: BigNumber): MorphoBluePosition {
    const newDebt = negativeToZero(this.debtAmount.minus(quoteAmount))
    return new MorphoBluePosition(
      this.owner,
      this.collateralAmount,
      newDebt,
      this.collateralPrice,
      this.quotePrice,
      this.pnl,
    )
  }

  close(): MorphoBluePosition {
    return new MorphoBluePosition(
      this.owner,
      ZERO,
      ZERO,
      this.collateralPrice,
      this.quotePrice,
      this.pnl,
    )
  }
}
