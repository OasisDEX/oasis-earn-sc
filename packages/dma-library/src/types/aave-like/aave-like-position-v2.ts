import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { negativeToZero, normalizeValue } from '@dma-common/utils/common'
import { LendingCumulativesData } from '@dma-library/types'
import { LendingPosition } from '@dma-library/types/morphoblue/morphoblue-position'
import { ReserveData } from '@dma-library/views/aave/types'
import { getBuyingPower } from '@dma-library/views/common'
import { IPositionCategory, RiskRatio } from '@domain'
import { BigNumber } from 'bignumber.js'

export class AaveLikePositionV2 implements LendingPosition {
  constructor(
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
    public collateralPrice: BigNumber,
    public debtPrice: BigNumber,
    public price: BigNumber,
    public pnl: {
      withFees: BigNumber
      withoutFees: BigNumber
      cumulatives: LendingCumulativesData
    },
    public category: IPositionCategory,
    public oraclePrice: BigNumber,
    public debtVariableBorrowRate: BigNumber,
    public collateralLiquidityRate: BigNumber,
    public liquidationPenalty: BigNumber,
    public reserveData: ReserveData,
  ) {}

  get liquidationPrice() {
    return normalizeValue(
      this.debtAmount.div(this.collateralAmount.times(this.category.liquidationThreshold)),
    )
  }

  get marketPrice() {
    return this.price
  }

  get liquidationToMarketPrice() {
    return this.liquidationPrice.div(this.marketPrice)
  }

  get collateralAvailable() {
    const approximatelyMinimumCollateral = this.debtAmount
      .dividedBy(this.oraclePrice)
      .dividedBy(this.category.maxLoanToValue)

    return negativeToZero(
      normalizeValue(this.collateralAmount.minus(approximatelyMinimumCollateral)),
    )
  }

  get riskRatio() {
    const loanToValue = this.debtAmount.div(this.collateralAmount.times(this.oraclePrice))

    return new RiskRatio(normalizeValue(loanToValue), RiskRatio.TYPE.LTV)
  }

  get maxRiskRatio() {
    return new RiskRatio(normalizeValue(this.category.maxLoanToValue), RiskRatio.TYPE.LTV)
  }

  get borrowRate(): BigNumber {
    const costOfBorrowingDebt = this.debtVariableBorrowRate
      .times(this.debtAmount)
      .times(this.debtPrice)
    const profitFromProvidingCollateral = this.collateralLiquidityRate
      .times(this.collateralAmount)
      .times(this.collateralPrice)

    return normalizeValue(
      costOfBorrowingDebt.minus(profitFromProvidingCollateral).div(this.netValue),
    )
  }

  get netValue(): BigNumber {
    return this.collateralAmount
      .times(this.collateralPrice)
      .minus(this.debtAmount.times(this.debtPrice))
  }

  get minRiskRatio() {
    return new RiskRatio(normalizeValue(ZERO), RiskRatio.TYPE.LTV)
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

  debtAvailable() {
    const maxLoanToValue = this.category.maxLoanToValue

    return negativeToZero(
      normalizeValue(
        this.collateralAmount.times(this.oraclePrice).times(maxLoanToValue).minus(this.debtAmount),
      ),
    )
  }

  deposit(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.plus(collateralAmount))
    return new AaveLikePositionV2(
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.debtPrice,
      this.price,
      this.pnl,
      this.category,
      this.oraclePrice,
      this.debtVariableBorrowRate,
      this.collateralLiquidityRate,
      this.liquidationPenalty,
      this.reserveData,
    )
  }

  withdraw(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.minus(collateralAmount))
    return new AaveLikePositionV2(
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.debtPrice,
      this.price,
      this.pnl,
      this.category,
      this.oraclePrice,
      this.debtVariableBorrowRate,
      this.collateralLiquidityRate,
      this.liquidationPenalty,
      this.reserveData,
    )
  }

  borrow(quoteAmount: BigNumber): AaveLikePositionV2 {
    const newDebt = negativeToZero(this.debtAmount.plus(quoteAmount))
    return new AaveLikePositionV2(
      this.owner,
      this.collateralAmount,
      newDebt,
      this.collateralPrice,
      this.debtPrice,
      this.price,
      this.pnl,
      this.category,
      this.oraclePrice,
      this.debtVariableBorrowRate,
      this.collateralLiquidityRate,
      this.liquidationPenalty,
      this.reserveData,
    )
  }

  payback(quoteAmount: BigNumber): AaveLikePositionV2 {
    const newDebt = negativeToZero(this.debtAmount.minus(quoteAmount))
    return new AaveLikePositionV2(
      this.owner,
      this.collateralAmount,
      newDebt,
      this.collateralPrice,
      this.debtPrice,
      this.price,
      this.pnl,
      this.category,
      this.oraclePrice,
      this.debtVariableBorrowRate,
      this.collateralLiquidityRate,
      this.liquidationPenalty,
      this.reserveData,
    )
  }

  close(): AaveLikePositionV2 {
    return new AaveLikePositionV2(
      this.owner,
      ZERO,
      ZERO,
      this.collateralPrice,
      this.debtPrice,
      this.price,
      this.pnl,
      this.category,
      this.oraclePrice,
      this.debtVariableBorrowRate,
      this.collateralLiquidityRate,
      this.liquidationPenalty,
      this.reserveData,
    )
  }
}
