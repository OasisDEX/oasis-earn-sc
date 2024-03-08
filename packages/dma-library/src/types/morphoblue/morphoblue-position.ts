import { Address } from '@deploy-configurations/types/address'
import { ONE, ZERO } from '@dma-common/constants'
import { negativeToZero, normalizeValue } from '@dma-common/utils/common'
import { getBuyingPower } from '@dma-library/views/common'
import { MorphoCumulativesData } from '@dma-library/views/morpho'
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

  debtAvailable(collateralAmount?: BigNumber, debtAmount?: BigNumber): BigNumber

  deposit(amount: BigNumber): LendingPosition

  withdraw(amount: BigNumber): LendingPosition

  borrow(amount: BigNumber): LendingPosition

  payback(amount: BigNumber): LendingPosition
}

interface MarketParams {
  id: string
  loanToken: Address
  collateralToken: Address
  oracle: Address
  irm: Address
  lltv: BigNumber
}

interface Market {
  totalSupplyAssets: BigNumber
  totalSupplyShares: BigNumber
  totalBorrowAssets: BigNumber
  totalBorrowShares: BigNumber
  lastUpdate: BigNumber
  fee: BigNumber
}

export class MorphoBluePosition implements LendingPosition {
  constructor(
    public owner: Address,
    public collateralAmount: BigNumber,
    public debtAmount: BigNumber,
    public collateralPrice: BigNumber,
    public debtPrice: BigNumber,
    public marketParams: MarketParams,
    public market: Market,
    // collateral / debt
    public price: BigNumber,
    public rate: BigNumber,
    public pnl: {
      withFees: BigNumber
      withoutFees: BigNumber
      cumulatives: MorphoCumulativesData
    },
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
    return new RiskRatio(normalizeValue(this.marketParams.lltv), RiskRatio.TYPE.LTV)
  }

  get borrowRate(): BigNumber {
    return this.rate
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

  get liquidationPenalty() {
    const M = new BigNumber(1.15)
    const BETA = new BigNumber(0.3)

    return BigNumber.min(
      M,
      ONE.div(BETA.times(this.maxRiskRatio.loanToValue).plus(ONE.minus(BETA))),
    ).minus(ONE)
  }

  debtAvailable(collateralAmount?: BigNumber, debtAmount?: BigNumber) {
    // (debt + addDebt) / ((col + addedColl) * price) = lltv
    // lltv*price*(col + addedColl) - debt = addDebt

    return negativeToZero(
      normalizeValue(
        this.maxRiskRatio.loanToValue
          .times(this.price)
          .times(collateralAmount || this.collateralAmount)
          .minus(debtAmount || this.debtAmount),
      ),
    )
  }

  deposit(collateralAmount: BigNumber) {
    const newCollateralAmount = negativeToZero(this.collateralAmount.plus(collateralAmount))
    return new MorphoBluePosition(
      this.owner,
      newCollateralAmount,
      this.debtAmount,
      this.collateralPrice,
      this.debtPrice,
      this.marketParams,
      this.market,
      this.price,
      this.rate,
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
      this.debtPrice,
      this.marketParams,
      this.market,
      this.price,
      this.rate,
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
      this.debtPrice,
      this.marketParams,
      this.market,
      this.price,
      this.rate,
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
      this.debtPrice,
      this.marketParams,
      this.market,
      this.price,
      this.rate,
      this.pnl,
    )
  }

  close(): MorphoBluePosition {
    return new MorphoBluePosition(
      this.owner,
      ZERO,
      ZERO,
      this.collateralPrice,
      this.debtPrice,
      this.marketParams,
      this.market,
      this.price,
      this.rate,
      this.pnl,
    )
  }
}
