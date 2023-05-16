import { FEE_BASE, ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { Optional } from '@dma-common/types/optional'
import { amountFromWei } from '@dma-common/utils/common'
import BigNumber from 'bignumber.js'

import { FLASHLOAN_SAFETY_MARGIN } from './constants'
import { IRiskRatio, RiskRatio } from './risk-ratio'
import { calculateFee } from './utils'

interface IPositionBalance {
  amount: BigNumber
  precision: number
  symbol: string
}

export function normaliseAmount(amount: BigNumber, precision: number): BigNumber {
  return amount.times(10 ** (TYPICAL_PRECISION - precision))
}

export function denormaliseAmount(amount: BigNumber, precision: number): BigNumber {
  return amount.div(10 ** (TYPICAL_PRECISION - precision))
}

export function adjustToTargetRiskRatio(
  position: {
    debt: IPositionBalance
    collateral: IPositionBalance
    riskRatio: IRiskRatio
    category: IPositionCategory
  },
  targetRiskRatio: IRiskRatio,
  params: IPositionTransitionParams,
) {
  const useFlashloanSafetyMargin = params.useFlashloanSafetyMargin ?? true
  const targetLTV = targetRiskRatio.loanToValue

  let isIncreasingRisk = false
  if (targetLTV.gt(position.riskRatio.loanToValue)) {
    isIncreasingRisk = true
  }

  const { depositedByUser, fees, prices, slippage, flashloan } = params
  const { maxLoanToValueFL: _maxLoanToValueFL } = flashloan
  params.collectSwapFeeFrom = params.collectSwapFeeFrom ?? 'sourceToken'
  const collectFeeFromSourceToken = params.collectSwapFeeFrom === 'sourceToken'
  const collectFeeFromTargetToken = !collectFeeFromSourceToken

  /**
   * C_W  Collateral in wallet to top-up or seed position
   * D_W  Debt token in wallet to top-up or seed position
   * */
  const collateralDepositedByUser = normaliseAmount(
    depositedByUser?.collateralInWei || ZERO,
    position.collateral.precision || TYPICAL_PRECISION,
  )
  const debtTokensDepositedByUser = normaliseAmount(
    depositedByUser?.debtInWei || ZERO,
    position.debt.precision || TYPICAL_PRECISION,
  )

  /**
   * These values are based on the initial state of the position.
   * If it's a new position then these values will be whatever the
   * user decides to seed the position with.
   *
   * C_C  Current collateral
   * D_C  Current debt
   * */
  const normalisedCurrentCollateral = (
    normaliseAmount(
      position.collateral.amount,
      position.collateral.precision || TYPICAL_PRECISION,
    ) || ZERO
  ).plus(collateralDepositedByUser)
  const normalisedCurrentDebt = (
    normaliseAmount(position.debt.amount, position.debt.precision || TYPICAL_PRECISION) || ZERO
  ).minus(debtTokensDepositedByUser)

  /**
   * The Oracle price is what we use to convert a position's collateral into the same
   * to the equivalent value as the position's Debt. Different protocols use different
   * base assets.
   * EG:
   * Maker uses DAI
   * AAVE uses ETH
   * Compound uses ETH
   *
   * P_O  Oracle Price
   * P_{O(FL->D)} Oracle Price to convert Flashloan token to Debt token
   * P_M  Market Price
   * P_{MS} Market Price adjusted for Slippage
   * */
  const oraclePrice = prices.oracle
  const oraclePriceFLtoDebtToken = prices?.oracleFLtoDebtToken || ONE
  // Always is in the direction of how many units of collateral does 1 unit of debt buy you
  const marketPrice = prices.market

  const marketPriceAdjustedForSlippage = marketPrice.times(
    isIncreasingRisk ? ONE.plus(slippage) : ONE.minus(slippage),
  )

  /**
   * Fees are relevant at different points in a transaction
   * Oazo fees are (as of writing) deducted before a Base token (eg DAI or ETH)
   * is converted to a Position's target collateral.
   *
   * Flashloan fees are charged by Flashloan lenders. (As of writing Maker's Mint Module
   * was free of charge).
   *
   * F_O Oazo Fee
   * F_F Flashloan Fee
   * */
  const oazoFee = fees.oazo
  const flashloanFee = fees.flashLoan

  /**
   *
   * Liquidation threshold is the ratio at which a position can be liquidated
   *
   * LT Liquidation threshold for position
   * LTV_{Max} Max Opening Loan-to-Value when generated Debt (DAI)
   * LTV_{MAX(FL)} Max Loan-to-Value when translating Flashloaned DAI into Debt tokens (EG ETH)
   */
  const maxLoanToValueFL = _maxLoanToValueFL || ONE

  /**
   * Unknown Variable X
   *
   * X = \frac{D_C\cdot P_{MS} - T_{LTV}\cdot C_C\cdot P_O\cdot P_{MS}}{((T_{LTV}\cdot (1 -F_O)\cdot P_O) - (1 +F_F)\cdot P_{MS})}
   * */
  const unknownVarX = normalisedCurrentDebt
    .times(marketPriceAdjustedForSlippage)
    .minus(
      targetLTV
        .times(normalisedCurrentCollateral)
        .times(oraclePrice)
        .times(marketPriceAdjustedForSlippage),
    )
    .div(
      targetLTV
        .times(ONE.minus(oazoFee.div(FEE_BASE)))
        .times(oraclePrice)
        .minus(ONE.plus(flashloanFee).times(marketPriceAdjustedForSlippage)),
    )
    .integerValue(BigNumber.ROUND_DOWN)

  /**
   * Is a flashloan required to reach the target state for the position?
   *
   * Y represents the available liquidity in the positio
   *
   * If Y is less than X where X is the amount of debt that's needed to be generate
   * the target position state then a flashloan is required
   *
   * Y=(C_C\cdot P_O) \cdot LTV_{MAX} - D_C
   * */
  const isFlashloanRequiredForIncrease = normalisedCurrentCollateral
    .times(oraclePrice)
    .times(position.category.maxLoanToValue)
    .minus(normalisedCurrentDebt)
    .lt(unknownVarX)

  /**
   * Finally, we can compute the deltas in debt & collateral
   *
   * ΔD  Debt delta
   * \Delta D = X \cdot (1+F_F)
   *
   * ΔC  Collateral delta
   * \Delta C = X \cdot (1 - F_O) / P_{MS}
   * */
  const shouldIncreaseDebtDeltaToAccountForFees = isIncreasingRisk && collectFeeFromSourceToken
  const debtDeltaPreFlashloanFee = unknownVarX.div(
    shouldIncreaseDebtDeltaToAccountForFees ? ONE.minus(oazoFee.div(FEE_BASE)) : ONE,
  )

  const collateralDelta = unknownVarX
    .div(marketPriceAdjustedForSlippage)
    .div(isIncreasingRisk ? ONE : ONE.minus(oazoFee.div(FEE_BASE)))
    .integerValue(BigNumber.ROUND_DOWN)

  /**
   * Is a flashloan required to reach the target state for the position when decreasing?
   *
   * */
  const isFlashloanRequiredForDecrease = position.category.maxLoanToValue.lte(
    normalisedCurrentDebt.div(
      collateralDelta.plus(normalisedCurrentCollateral).times(marketPriceAdjustedForSlippage),
    ),
  )

  const isFlashloanRequired = isFlashloanRequiredForIncrease || isFlashloanRequiredForDecrease

  const debtDelta = debtDeltaPreFlashloanFee
    .times(ONE.plus(isFlashloanRequired ? flashloanFee : ZERO))
    .integerValue(BigNumber.ROUND_DOWN)

  /**
   *
   * Flashloan amount
   *
   * X_B Amount to flashloan or payback
   */
  const flashloanTokenIsSameAsDebt = flashloan.tokenSymbol === position.debt.symbol

  const _useFlashloanSafetyMargin = flashloanTokenIsSameAsDebt ? ZERO : useFlashloanSafetyMargin
  const amountToFlashloan = debtDelta
    .minus(debtTokensDepositedByUser)
    .times(oraclePriceFLtoDebtToken)
    .div(
      maxLoanToValueFL.times(_useFlashloanSafetyMargin ? ONE.minus(FLASHLOAN_SAFETY_MARGIN) : ONE),
    )
    .integerValue(BigNumber.ROUND_DOWN)

  /*
   * Account for fees being collected from either
   * The sourceToken or targetToken in the swap
   */
  let normalisedSourceFee = ZERO
  let normalisedTargetFee = ZERO
  const debtTokenIsSourceToken = isIncreasingRisk

  if (collectFeeFromSourceToken) {
    normalisedSourceFee = (
      isIncreasingRisk
        ? calculateFee(debtDelta, oazoFee, new BigNumber(FEE_BASE))
        : calculateFee(collateralDelta, oazoFee, new BigNumber(FEE_BASE))
    ).integerValue(BigNumber.ROUND_DOWN)
  }
  if (collectFeeFromTargetToken) {
    normalisedTargetFee = (
      isIncreasingRisk
        ? calculateFee(collateralDelta, oazoFee, new BigNumber(FEE_BASE))
        : calculateFee(debtDelta, oazoFee, new BigNumber(FEE_BASE))
    ).integerValue(BigNumber.ROUND_DOWN)
  }

  let normalisedFromTokenAmount
  let normalisedMinToTokenAmount
  if (isIncreasingRisk) {
    normalisedFromTokenAmount = debtDelta
    normalisedMinToTokenAmount = collateralDelta
  } else {
    normalisedFromTokenAmount = collateralDelta.abs()
    normalisedMinToTokenAmount = debtDelta.abs()
  }

  const sourceFee = denormaliseAmount(
    normalisedSourceFee,
    debtTokenIsSourceToken ? position.debt.precision : position.collateral.precision,
  ).integerValue(BigNumber.ROUND_DOWN)
  const targetFee = denormaliseAmount(
    normalisedTargetFee,
    debtTokenIsSourceToken ? position.collateral.precision : position.debt.precision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const fromTokenPrecision = isIncreasingRisk
    ? position.debt.precision
    : position.collateral.precision

  const toTokenPrecision = isIncreasingRisk
    ? position.collateral.precision
    : position.debt.precision

  const fromTokenAmount = denormaliseAmount(
    normalisedFromTokenAmount,
    fromTokenPrecision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const minToTokenAmount = denormaliseAmount(
    normalisedMinToTokenAmount,
    toTokenPrecision,
  ).integerValue(BigNumber.ROUND_DOWN)

  return {
    debtDelta,
    collateralDelta,
    oraclePrice,
    normalisedCurrentDebt,
    normalisedCurrentCollateral,
    delta: {
      debt: denormaliseAmount(debtDelta, position.debt.precision).integerValue(
        BigNumber.ROUND_DOWN,
      ),
      collateral: denormaliseAmount(collateralDelta, position.collateral.precision).integerValue(
        BigNumber.ROUND_DOWN,
      ),
      flashloanAmount: amountToFlashloan,
    },
    swap: {
      fromTokenAmount,
      minToTokenAmount,
      tokenFee: collectFeeFromSourceToken ? sourceFee : targetFee,
      collectFeeFrom: collectFeeFromSourceToken
        ? ('sourceToken' as const)
        : ('targetToken' as const),
      sourceToken: isIncreasingRisk
        ? { symbol: position.debt.symbol, precision: position.debt.precision }
        : { symbol: position.collateral.symbol, precision: position.collateral.precision },
      targetToken: isIncreasingRisk
        ? { symbol: position.collateral.symbol, precision: position.collateral.precision }
        : { symbol: position.debt.symbol, precision: position.debt.precision },
    },
    flags: {
      requiresFlashloan: isFlashloanRequired,
      isIncreasingRisk,
    },
  }
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

export interface IPositionCategory {
  liquidationThreshold: BigNumber
  maxLoanToValue: BigNumber
  dustLimit: BigNumber
}

export interface IBasePosition {
  collateral: PositionBalance
  debt: PositionBalance
  category: IPositionCategory
}

export type Delta = { debt: BigNumber; collateral: BigNumber; flashloanAmount: BigNumber }
export type Swap = {
  fromTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  tokenFee: BigNumber
  collectFeeFrom: 'sourceToken' | 'targetToken'
  sourceToken: { symbol: string; precision: number }
  targetToken: { symbol: string; precision: number }
}
type Flags = { requiresFlashloan: boolean; isIncreasingRisk: boolean }

export interface IBaseSimulatedTransition {
  position: IPosition
  delta: Delta
  swap: Swap
  flags: Flags
}

// TODO: consider multi-collateral positions
interface IPositionTransitionParams {
  // Where Wei is the smallest unit of the token
  depositedByUser?: {
    collateralInWei?: BigNumber
    debtInWei?: BigNumber
  }
  flashloan: {
    /* Max Loan-to-Value when translating Flashloaned DAI into Debt tokens (EG ETH) */
    maxLoanToValueFL?: BigNumber
    tokenSymbol: string
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
  private _feeBase: BigNumber = new BigNumber(10000)

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

  // returns the percentage amount (as decimal) that the collateral price would have to

  public get liquidationPrice() {
    return this.debt.amount.div(this.collateral.amount.times(this.category.liquidationThreshold))
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
    const adjustResults = adjustToTargetRiskRatio(this, targetRiskRatio, params)

    const targetPosition = this._createTargetPosition(
      adjustResults.debtDelta,
      adjustResults.collateralDelta,
      adjustResults.oraclePrice,
      adjustResults.normalisedCurrentDebt,
      adjustResults.normalisedCurrentCollateral,
    )
    return {
      position: targetPosition,
      delta: adjustResults.delta,
      swap: adjustResults.swap,
      flags: adjustResults.flags,
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
      amount: this._denormaliseAmount(
        newCollateralAmount,
        this.collateral.precision || TYPICAL_PRECISION,
      ).integerValue(BigNumber.ROUND_DOWN),
    }

    const newDebtAmount = this._denormaliseAmount(
      currentDebt.plus(debtDelta),
      this.debt.precision || TYPICAL_PRECISION,
    ).integerValue(BigNumber.ROUND_DOWN)

    const newDebt = { ...this.debt, amount: newDebtAmount }

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

  private _normaliseAmount(amount: BigNumber, precision: number): BigNumber {
    return amount.times(10 ** (TYPICAL_PRECISION - precision))
  }

  private _denormaliseAmount(amount: BigNumber, precision: number): BigNumber {
    return amount.div(10 ** (TYPICAL_PRECISION - precision))
  }
}
