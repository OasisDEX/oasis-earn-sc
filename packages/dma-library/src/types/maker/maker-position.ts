import { Address } from '@deploy-configurations/types/address'
import { ONE, ZERO } from '@dma-common/constants'
import { negativeToZero, normalizeValue } from '@dma-common/utils/common'
import { LendingPosition } from '@dma-library/types/morphoblue/morphoblue-position'
import { getBuyingPower } from '@dma-library/views/common'
import { MorphoCumulativesData } from '@dma-library/views/morpho'
import { RiskRatio } from '@domain'
import { BigNumber } from 'bignumber.js'

export class MakerPosition implements LendingPosition {
  constructor(
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
    public marketCollateralPrice: BigNumber,
    public osmCurrentCollateralPrice: BigNumber,
    public osmNextCollateralPrice: BigNumber,
    public debtPrice: BigNumber,
    // collateral / debt
    public price: BigNumber,
    public rate: BigNumber,
    public pnl: {
      withFees: BigNumber
      withoutFees: BigNumber
      cumulatives: MorphoCumulativesData
    },
    public liquidationRatio: BigNumber,
    public penalty: BigNumber,
  ) {}

  get liquidationPrice() {
    return normalizeValue(
      ONE.div(this.collateralAmount.times(this.maxRiskRatio.loanToValue).div(this.debtAmount)),
    )
  }

  get marketPrice() {
    return this.price
  }

  get liquidationToMarketPrice() {
    return this.liquidationPrice.div(this.marketPrice)
  }

  // How much collateral can we withdraw to not get liquidated, (to get to the verge of liquidation)
  get collateralAvailable() {
    const collateralAvailable = this.collateralAmount.minus(
      this.debtAmount.div(this.maxRiskRatio.loanToValue).div(this.price),
    )

    return negativeToZero(normalizeValue(collateralAvailable))
  }

  get riskRatio() {
    const loanToValue = this.debtAmount.div(this.collateralAmount.times(this.price))

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get maxRiskRatio() {
    return new RiskRatio(normalizeValue(this.liquidationRatio), RiskRatio.TYPE.LTV)
  }

  get borrowRate(): BigNumber {
    return this.rate
  }

  get netValue(): BigNumber {
    return this.collateralAmount
      .times(this.osmCurrentCollateralPrice)
      .minus(this.debtAmount.times(this.debtPrice))
  }

  get minRiskRatio() {
    return new RiskRatio(normalizeValue(ZERO), RiskRatio.TYPE.LTV)
  }

  get buyingPower() {
    return getBuyingPower({
      netValue: this.netValue,
      collateralPrice: this.osmCurrentCollateralPrice,
      marketPrice: this.marketPrice,
      debtAmount: this.debtAmount,
      maxRiskRatio: this.maxRiskRatio,
    })
  }

  get liquidationPenalty() {
    console.log('liquidationPenalty', this.penalty)
    return this.penalty
  }

  debtAvailable(collateralAmount?: BigNumber, debtAmount?: BigNumber) {
    // (debt + addDebt) / ((col + addedColl) * price) = lltv
    // lltv*price*(col + addedColl) - debt = addDebt

    return negativeToZero(
      normalizeValue(
        this.maxRiskRatio.loanToValue
          .times(this.marketPrice)
          .times(collateralAmount || this.collateralAmount)
          .minus(debtAmount || this.debtAmount),
      ),
    )
  }

  deposit(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.plus(collateralAmount))
    return new MakerPosition(
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.marketCollateralPrice,
      this.osmCurrentCollateralPrice,
      this.osmNextCollateralPrice,
      this.debtPrice,
      this.price,
      this.rate,
      this.pnl,
      this.liquidationRatio,
      this.penalty,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.minus(collateralAmount))
    return new MakerPosition(
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.marketCollateralPrice,
      this.osmCurrentCollateralPrice,
      this.osmNextCollateralPrice,
      this.debtPrice,
      this.price,
      this.rate,
      this.pnl,
      this.liquidationRatio,
      this.penalty,
    )
  }

  borrow(quoteAmount: BigNumber): MakerPosition {
    const newDebt = negativeToZero(this.debtAmount.plus(quoteAmount))
    return new MakerPosition(
      this.owner,
      this.collateralAmount,
      newDebt,
      this.marketCollateralPrice,
      this.osmCurrentCollateralPrice,
      this.osmNextCollateralPrice,
      this.debtPrice,
      this.price,
      this.rate,
      this.pnl,
      this.liquidationRatio,
      this.penalty,
    )
  }

  payback(quoteAmount: BigNumber): MakerPosition {
    const newDebt = negativeToZero(this.debtAmount.minus(quoteAmount))
    return new MakerPosition(
      this.owner,
      this.collateralAmount,
      newDebt,
      this.marketCollateralPrice,
      this.osmCurrentCollateralPrice,
      this.osmNextCollateralPrice,
      this.debtPrice,
      this.price,
      this.rate,
      this.pnl,
      this.liquidationRatio,
      this.penalty,
    )
  }

  close(): MakerPosition {
    return new MakerPosition(
      this.owner,
      ZERO,
      ZERO,
      this.marketCollateralPrice,
      this.osmCurrentCollateralPrice,
      this.osmNextCollateralPrice,
      this.debtPrice,
      this.price,
      this.rate,
      this.pnl,
      this.liquidationRatio,
      this.penalty,
    )
  }
}
