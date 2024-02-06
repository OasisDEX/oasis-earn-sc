import { ONE, TYPICAL_PRECISION, ZERO } from '@oasisdex/dma-common/constants'
import { Optional } from '@oasisdex/dma-common/types'
import { amountFromWei } from '@oasisdex/dma-common/utils/common'
import BigNumber from 'bignumber.js'

import { adjustToTargetRiskRatio, WithFlags } from './adjust-position'
import { transientCollateralFlashloan } from './flashloans'
import { IRiskRatio, RiskRatio } from './risk-ratio'
import {
  isRiskIncreasing,
  revertToTokenSpecificPrecision,
  standardiseAmountTo18Decimals,
} from './utils'

interface IPositionBalance {
  amount: BigNumber
  precision: number
  symbol: string
}

export interface IPositionV2 {
  debt: IPositionBalance
  collateral: IPositionBalance
  riskRatio: IRiskRatio
}

export class PositionBalance implements IPositionBalance {
  public amount: BigNumber
  public precision: number
  public symbol: string

  constructor(args: Optional<IPositionBalance, 'precision'>) {
    this.amount = args.amount
    this.precision = args.precision || TYPICAL_PRECISION
    this.symbol = args.symbol
  }

  public get normalisedAmount() {
    return this.amount.times(10 ** (TYPICAL_PRECISION - this.precision))
  }

  public toString(): string {
    return `${this.amount.toFixed(this.precision)} ${this.symbol}`
  }
}

/** @deprecated Not applicable to all protocols */
export interface IPositionCategory {
  liquidationThreshold: BigNumber
  maxLoanToValue: BigNumber
  dustLimit: BigNumber
}

/** @deprecated In favour of IPositionV2 */
export interface IBasePosition {
  collateral: PositionBalance
  debt: PositionBalance
  category: IPositionCategory
}

export type Delta = { debt: BigNumber; collateral: BigNumber }
export type WithFlashloan = {
  flashloan: {
    amount: BigNumber
    token: {
      symbol: string
      precision: number
    }
  }
}

export type Swap = {
  fromTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  tokenFee: BigNumber
  collectFeeFrom: 'sourceToken' | 'targetToken'
  sourceToken: { symbol: string; precision: number }
  targetToken: { symbol: string; precision: number }
}

export type IBaseSimulatedTransition = {
  position: IPosition
  delta: Delta
  swap: Swap
} & WithFlags &
  WithFlashloan

// TODO: consider multi-collateral positions

export interface IPositionTransitionParams {
  // Where Wei is the smallest unit of the token
  depositedByUser?: {
    collateralInWei?: BigNumber
    debtInWei?: BigNumber
  }
  flashloan?: {
    /* Max Loan-to-Value when translating Flashloaned DAI into Debt tokens (EG ETH) */
    maxLoanToValueFL?: BigNumber
    token: {
      symbol: string
      precision: number
    }
  }
  fees: {
    oazo: BigNumber
    flashLoan: BigNumber
  }
  prices: {
    /*
      TODO: Update params to make differentiate the price configurations between increase/decrease more clearly
      This oracle price is the exchange rate going from collateral -> debt.
      When decreasing risk / closing we need the inverse of the exchange rate going in the opposite direction (debt -> collateral)
    */
    oracle: BigNumber
    // Always the amount of collateral you can buy with 1 debt token
    market: BigNumber
    oracleFLtoDebtToken?: BigNumber
  }
  slippage: BigNumber

  /* For AAVE this would be ETH. For Maker it would be DAI (although strictly speaking USD) */
  collectSwapFeeFrom?: 'sourceToken' | 'targetToken'
  debug?: boolean

  /* Flashloan logic for when flashloan is not same token symbol as debt */
  useFlashloanSafetyMargin?: boolean
}

/** @deprecated Not applicable to all protocols. Please use IPositionV2 */
export interface IPosition extends IBasePosition {
  minConfigurableRiskRatio: (marketPriceAccountingForSlippage: BigNumber) => IRiskRatio
  riskRatio: IRiskRatio
  healthFactor: BigNumber
  relativeCollateralPriceMovementUntilLiquidation: BigNumber
  liquidationPrice: BigNumber
  maxDebtToBorrow: BigNumber
  maxDebtToBorrowWithCurrentCollateral: BigNumber
  maxCollateralToWithdraw: BigNumber
  debtToPaybackAll: BigNumber
  oraclePriceForCollateralDebtExchangeRate: BigNumber
  adjustToTargetRiskRatio: (
    targetRiskRatio: IRiskRatio,
    params: IPositionTransitionParams,
  ) => IBaseSimulatedTransition

  deposit(amount: BigNumber): IPosition

  borrow(amount: BigNumber): IPosition

  withdraw(amount: BigNumber): IPosition

  payback(amount: BigNumber): IPosition
}

export class Position implements IPosition {
  public debt: PositionBalance
  public collateral: PositionBalance
  public category: IPositionCategory

  constructor(
    debt: Optional<IPositionBalance, 'precision'>,
    collateral: Optional<IPositionBalance, 'precision'>,
    oraclePrice: BigNumber,
    category: IPositionCategory,
  ) {
    this.debt = new PositionBalance(debt)
    this.collateral = new PositionBalance(collateral)
    this._oraclePriceForCollateralDebtExchangeRate = oraclePrice
    this.category = category
  }

  private _oraclePriceForCollateralDebtExchangeRate: BigNumber

  public get oraclePriceForCollateralDebtExchangeRate() {
    return this._oraclePriceForCollateralDebtExchangeRate
  }

  public get maxDebtToBorrow() {
    const maxLoanToValue = this.category.maxLoanToValue
    return this.collateral.normalisedAmount
      .times(this._oraclePriceForCollateralDebtExchangeRate)
      .times(maxLoanToValue)
      .minus(this.debt.normalisedAmount)
  }

  public get maxDebtToBorrowWithCurrentCollateral() {
    const maxLoanToValue = this.category.maxLoanToValue
    return this.collateral.normalisedAmount
      .times(this._oraclePriceForCollateralDebtExchangeRate)
      .times(maxLoanToValue)
  }

  public get maxCollateralToWithdraw() {
    const approximatelyMinimumCollateral = this.debt.normalisedAmount
      .dividedBy(this._oraclePriceForCollateralDebtExchangeRate)
      .dividedBy(this.category.maxLoanToValue)
      .integerValue()

    return this.collateral.amount.minus(
      this._denormaliseAmount(approximatelyMinimumCollateral, this.collateral.precision),
    )
  }

  public get debtToPaybackAll() {
    const debt = this.debt.amount
    const offset = new BigNumber(1000)
    return debt.plus(debt.div(offset).integerValue(BigNumber.ROUND_UP))
  }

  public get riskRatio() {
    const ltv = this.debt.normalisedAmount.div(
      this.collateral.normalisedAmount.times(this._oraclePriceForCollateralDebtExchangeRate),
    )

    return new RiskRatio(ltv.isNaN() || !ltv.isFinite() ? ZERO : ltv, RiskRatio.TYPE.LTV)
  }

  public get healthFactor() {
    return this.collateral.normalisedAmount
      .times(this.category.liquidationThreshold)
      .times(this._oraclePriceForCollateralDebtExchangeRate)
      .div(this.debt.normalisedAmount)
  }

  // move relative to debt for the position to be at risk of liquidation.
  public get relativeCollateralPriceMovementUntilLiquidation() {
    return ONE.minus(ONE.div(this.healthFactor))
  }

  public get liquidationPrice() {
    return this.debt.amount.div(this.collateral.amount.times(this.category.liquidationThreshold))
  }

  // returns the percentage amount (as decimal) that the collateral price would have to

  public static emptyPosition(
    debt: Optional<IPositionBalance, 'precision'>,
    collateral: Optional<IPositionBalance, 'precision'>,
  ) {
    return new Position(debt, collateral, ZERO, {
      liquidationThreshold: ZERO,
      maxLoanToValue: ZERO,
      dustLimit: ZERO,
    })
  }

  // 1 unit of debt equals X units of collateral, where X is the market price.
  public minConfigurableRiskRatio(marketPriceAccountingForSlippage: BigNumber): IRiskRatio {
    const debtDelta = this.debt.amount.minus(this.category.dustLimit)

    const ltv = this.category.dustLimit.div(
      amountFromWei(debtDelta, this.debt.precision)
        .div(marketPriceAccountingForSlippage)
        .plus(amountFromWei(this.collateral.amount, this.collateral.precision))
        .times(this._oraclePriceForCollateralDebtExchangeRate),
    )

    return new RiskRatio(ltv, RiskRatio.TYPE.LTV)
  }

  public deposit(amount: BigNumber): IPosition {
    return this.changeCollateral(amount)
  }

  public withdraw(amount: BigNumber): IPosition {
    return this.changeCollateral(amount.negated())
  }

  public borrow(amount: BigNumber): IPosition {
    return this.changeDebt(amount)
  }

  public payback(amount: BigNumber): IPosition {
    return this.changeDebt(amount.negated())
  }

  /**
   * @deprecated pending updated IPositionV2 refactor with protocol specific Position classes
   * Calculates the target (or desired) state of a position
   * We must convert all values to the same 18 decimal precision to ensure the maths works as expected
   *
   * Maths breakdown: {@link https://www.notion.so/oazo/Oasis-Maths-cceaa36d5c2b49a7b5129105cee1d35f#608e831f54fc4557bf004af7c453f865}
   * Concrete scenarios: {@link https://docs.google.com/spreadsheets/d/1ZB0dlQbjgi7eM-cSyGowWlZCKG-326pWZeHxZAPFOT0/edit?usp=sharing}
   *
   * @returns A position's change in debt, change in collateral and whether a flashloan is necessary to achieve the change
   */
  adjustToTargetRiskRatio(
    targetRiskRatio: IRiskRatio,
    params: IPositionTransitionParams,
  ): IBaseSimulatedTransition {
    /** Temporary solution whilst we progressively make this class legacy */
    const mappedParams = {
      ...params,
      toDeposit: {
        collateral: params.depositedByUser?.collateralInWei || ZERO,
        debt: params.depositedByUser?.debtInWei || ZERO,
      },
    }
    const simulatedAdjust = adjustToTargetRiskRatio(this, targetRiskRatio, mappedParams)

    // Duplicated here as temporary solution whilst we progressively make this class legacy
    const currentCollateral = this.collateral.amount.plus(mappedParams.toDeposit.collateral)
    const currentDebt = this.debt.amount.minus(mappedParams.toDeposit.debt)

    /**
     * TODO: refactor
     * Only relevant for FMM flashloans
     * Should be handled independently from adjust position logic
     */
    const flashloanAmount = mappedParams.flashloan
      ? transientCollateralFlashloan(
          mappedParams.fees.flashLoan,
          mappedParams.prices.oracleFLtoDebtToken || ONE,
          simulatedAdjust.delta.debt.minus(mappedParams.depositedByUser?.debtInWei || ZERO),
          mappedParams.flashloan.token.precision,
          this.debt.precision,
          mappedParams.flashloan.maxLoanToValueFL,
        )
      : ZERO

    const flashloanToken = mappedParams.flashloan
      ? mappedParams.flashloan.token
      : {
          symbol: '',
          precision: 0,
        }

    return {
      ...simulatedAdjust,
      position: this._createTargetPosition(
        simulatedAdjust.delta.debt,
        simulatedAdjust.delta.collateral,
        params.prices.oracle,
        currentDebt,
        currentCollateral,
      ),
      delta: {
        ...simulatedAdjust.delta,
      },
      flags: {
        // TODO: Flashloan is always required on adjust (multiply) currently
        requiresFlashloan: true,
        isIncreasingRisk: isRiskIncreasing(targetRiskRatio.loanToValue, this.riskRatio.loanToValue),
      },
      flashloan: {
        amount: flashloanAmount,
        token: flashloanToken,
      },
    }
  }

  private _createTargetPosition(
    debtDelta: BigNumber,
    collateralDelta: BigNumber,
    oraclePrice: BigNumber,
    currentDebt: BigNumber,
    currentCollateral: BigNumber,
  ): IPosition {
    const newCollateralAmount = currentCollateral.plus(collateralDelta)
    const newCollateral = {
      ...this.collateral,
      amount: newCollateralAmount,
    }

    const newDebt = { ...this.debt, amount: currentDebt.plus(debtDelta) }

    return new Position(newDebt, newCollateral, oraclePrice, this.category)
  }

  private changeDebt(debtDelta: BigNumber): IPosition {
    const newDebt = new PositionBalance({
      amount: this.debt.amount.plus(debtDelta),
      precision: this.debt.precision,
      symbol: this.debt.symbol,
    })
    return new Position(
      newDebt,
      this.collateral,
      this._oraclePriceForCollateralDebtExchangeRate,
      this.category,
    )
  }

  private changeCollateral(collateralDelta: BigNumber): IPosition {
    const newCollateral = new PositionBalance({
      precision: this.collateral.precision,
      symbol: this.collateral.symbol,
      amount: this.collateral.amount.plus(collateralDelta),
    })
    return new Position(
      this.debt,
      newCollateral,
      this._oraclePriceForCollateralDebtExchangeRate,
      this.category,
    )
  }

  private _denormaliseAmount(amount: BigNumber, precision: number): BigNumber {
    return revertToTokenSpecificPrecision(amount, precision)
  }
}

export const createRiskRatio = (
  debt: IPositionBalance,
  collateral: IPositionBalance,
  /** Oracle price of 1 Collateral Token in Debt Tokens  */
  oraclePrice: BigNumber,
) => {
  const ltv = standardiseAmountTo18Decimals(debt.amount, debt.precision).div(
    standardiseAmountTo18Decimals(collateral.amount, collateral.precision).times(oraclePrice),
  )

  return new RiskRatio(ltv.isNaN() || !ltv.isFinite() ? ZERO : ltv, RiskRatio.TYPE.LTV)
}
