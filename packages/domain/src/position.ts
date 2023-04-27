import BigNumber from 'bignumber.js'

import { IRiskRatio, RiskRatio } from './risk-ratio'
import { ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { amountFromWei, logDebug } from '@dma-common/utils/common'
import { calculateFee } from './utils'
import { FLASHLOAN_SAFETY_MARGIN } from './constants'
import { Optional } from '@dma-common/types/optional'

interface IPositionBalance {
  amount: BigNumber
  precision: number
  symbol: string
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

type Delta = { debt: BigNumber; collateral: BigNumber; flashloanAmount: BigNumber }
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
    if (params.debug) {
      logDebug(
        [
          `**!!All values are converted to same precision during calculations!!**`,
          `Current position debt: ${this.debt.amount.toString()}`,
          `Current position collateral ${this.collateral.amount.toString()}`,
          `Normalised current position debt: ${this.debt.normalisedAmount.toString()}`,
          `Normalised current position collateral ${this.collateral.normalisedAmount.toString()}`,
          `Multiple: ${this.riskRatio.multiple.toString()}`,
        ],
        'Initial: ',
      )
    }

    const useFlashloanSafetyMargin = params.useFlashloanSafetyMargin ?? true
    const targetLTV = targetRiskRatio.loanToValue

    let isIncreasingRisk = false
    if (targetLTV.gt(this.riskRatio.loanToValue)) {
      isIncreasingRisk = true
    }

    const { depositedByUser, fees, prices, slippage, flashloan, debug } = params
    const { maxLoanToValueFL: _maxLoanToValueFL } = flashloan
    params.collectSwapFeeFrom = params.collectSwapFeeFrom ?? 'sourceToken'
    const collectFeeFromSourceToken = params.collectSwapFeeFrom === 'sourceToken'
    const collectFeeFromTargetToken = !collectFeeFromSourceToken

    /**
     * C_W  Collateral in wallet to top-up or seed position
     * D_W  Debt token in wallet to top-up or seed position
     * */
    const collateralDepositedByUser = this._normaliseAmount(
      depositedByUser?.collateralInWei || ZERO,
      this.collateral.precision || TYPICAL_PRECISION,
    )
    const debtTokensDepositedByUser = this._normaliseAmount(
      depositedByUser?.debtInWei || ZERO,
      this.debt.precision || TYPICAL_PRECISION,
    )

    /**
     * These values are based on the initial state of the position.
     * If it's a new position then these values will be whatever the
     * user decides to seed the position with.
     *
     * C_C  Current collateral
     * D_C  Current debt
     * */
    const normalisedCurrentCollateral = (this.collateral.normalisedAmount || ZERO).plus(
      collateralDepositedByUser,
    )
    const normalisedCurrentDebt = (this.debt.normalisedAmount || ZERO).minus(
      debtTokensDepositedByUser,
    )

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
    const liquidationThreshold = this.category.liquidationThreshold
    const maxLoanToValue = this.category.maxLoanToValue
    const maxLoanToValueFL = _maxLoanToValueFL || ONE

    if (debug) {
      logDebug(
        [
          `**!!All values are converted to same precision during calculations!!**`,
          `Collateral tokens deposited by User: ${(
            depositedByUser?.collateralInWei || ZERO
          ).toString()}`,
          `Normalised collateral tokens deposited by User: ${collateralDepositedByUser.toString()}`,

          `Debt tokens deposited by User: ${(depositedByUser?.debtInWei || ZERO).toString()}`,
          `Normalised debt tokens deposited by User: ${debtTokensDepositedByUser.toString()}`,

          `Normalised current collateral inc. top-up/seed: ${normalisedCurrentCollateral.toString()}`,
          `Normalised current debt inc. top-up/seed: ${normalisedCurrentDebt.toString()}`,

          `Oracle price: ${oraclePrice.toString()}`,
          `Oracle Price FL-to-Debt token: ${oraclePriceFLtoDebtToken.toString()}`,
          `Market price: ${marketPrice.toString()}`,
          `Slippage: ${slippage.toString()}`,
          `Market price adj. slippage: ${marketPriceAdjustedForSlippage.toString()}`,

          `Oazo fee: ${oazoFee.toFixed(4)}`,
          `Oazo feeBase: ${this._feeBase.toFixed(4)}`,
          `Flashloan fee: ${flashloanFee.toFixed(4)}`,

          `Liquidation threshold: ${liquidationThreshold.toFixed(4)}`,
          `Max Loan-to-Value when opening: ${maxLoanToValue.toFixed(4)}`,
          `Max Loan-to-Value when converting flashloaned DAI to Debt symbol tokens: ${maxLoanToValueFL.toFixed(
            4,
          )}`,

          `Target loan-to-value: ${targetLTV.toString()}`,
          `Target multiple: ${targetRiskRatio.multiple.toString()}`,
        ],
        'Params: ',
      )
    }

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
          .times(ONE.minus(oazoFee.div(this._feeBase)))
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
      .times(this.category.maxLoanToValue)
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
      shouldIncreaseDebtDeltaToAccountForFees ? ONE.minus(oazoFee.div(this._feeBase)) : ONE,
    )

    const collateralDelta = unknownVarX
      .div(marketPriceAdjustedForSlippage)
      .div(isIncreasingRisk ? ONE : ONE.minus(oazoFee.div(this._feeBase)))
      .integerValue(BigNumber.ROUND_DOWN)

    /**
     * Is a flashloan required to reach the target state for the position when decreasing?
     *
     * */
    const isFlashloanRequiredForDecrease = this.category.maxLoanToValue.lte(
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
    const flashloanTokenIsSameAsDebt = flashloan.tokenSymbol === this.debt.symbol

    const _useFlashloanSafetyMargin = flashloanTokenIsSameAsDebt ? ZERO : useFlashloanSafetyMargin
    const amountToFlashloan = debtDelta
      .minus(debtTokensDepositedByUser)
      .times(oraclePriceFLtoDebtToken)
      .div(
        maxLoanToValueFL.times(
          _useFlashloanSafetyMargin ? ONE.minus(FLASHLOAN_SAFETY_MARGIN) : ONE,
        ),
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
          ? calculateFee(debtDelta, oazoFee, this._feeBase)
          : calculateFee(collateralDelta, oazoFee, this._feeBase)
      ).integerValue(BigNumber.ROUND_DOWN)
    }
    if (collectFeeFromTargetToken) {
      normalisedTargetFee = (
        isIncreasingRisk
          ? calculateFee(collateralDelta, oazoFee, this._feeBase)
          : calculateFee(debtDelta, oazoFee, this._feeBase)
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

    const targetPosition = this._createTargetPosition(
      debtDelta,
      collateralDelta,
      oraclePrice,
      normalisedCurrentDebt,
      normalisedCurrentCollateral,
    )

    const sourceFee = this._denormaliseAmount(
      normalisedSourceFee,
      debtTokenIsSourceToken ? this.debt.precision : this.collateral.precision,
    ).integerValue(BigNumber.ROUND_DOWN)
    const targetFee = this._denormaliseAmount(
      normalisedTargetFee,
      debtTokenIsSourceToken ? this.collateral.precision : this.debt.precision,
    ).integerValue(BigNumber.ROUND_DOWN)

    const fromTokenPrecision = isIncreasingRisk
      ? targetPosition.debt.precision
      : targetPosition.collateral.precision

    const toTokenPrecision = isIncreasingRisk
      ? targetPosition.collateral.precision
      : targetPosition.debt.precision

    const fromTokenAmount = this._denormaliseAmount(
      normalisedFromTokenAmount,
      fromTokenPrecision,
    ).integerValue(BigNumber.ROUND_DOWN)
    const fromTokenAmountAfterFee = this._denormaliseAmount(
      normalisedFromTokenAmount.minus(normalisedSourceFee),
      fromTokenPrecision,
    ).integerValue(BigNumber.ROUND_DOWN)
    const unknownVarXNoramlised = this._denormaliseAmount(
      unknownVarX,
      fromTokenPrecision,
    ).integerValue(BigNumber.ROUND_DOWN)
    const minToTokenAmount = this._denormaliseAmount(
      normalisedMinToTokenAmount,
      toTokenPrecision,
    ).integerValue(BigNumber.ROUND_DOWN)

    if (debug) {
      logDebug(
        [
          `Is flashloan required: ${isFlashloanRequired}`,
          `Amount to flashloan: ${amountToFlashloan}`,
          `----`,
          `Normalised unknown X: ${unknownVarXNoramlised.toString()}`,
          `Normalised from token amount: ${normalisedFromTokenAmount.toString()}`,
          `Normalised from token amount after fees: ${normalisedFromTokenAmount
            .minus(normalisedSourceFee)
            .toString()}`,
          `Unknown X: ${unknownVarX.toString()}`,
          `From token amount: ${fromTokenAmount.toString()}`,
          `From token amount after fees: ${fromTokenAmountAfterFee.toString()}`,
          `From token: ${
            isIncreasingRisk ? targetPosition.debt.symbol : targetPosition.collateral.symbol
          }`,
          `Normalised min To token amount: ${normalisedMinToTokenAmount.toString()}`,
          `Min To token amount: ${minToTokenAmount.toString()}`,
          `To token: ${
            isIncreasingRisk ? targetPosition.collateral.symbol : targetPosition.debt.symbol
          }`,
          `----`,
          `Normalised debt delta: ${debtDelta.toString()}`,
          `Normalised collateral delta: ${collateralDelta.toString()}`,
          `Debt delta: ${this._denormaliseAmount(debtDelta, this.debt.precision).integerValue(
            BigNumber.ROUND_DOWN,
          )}`,
          `Collateral delta: ${this._denormaliseAmount(
            collateralDelta,
            this.collateral.precision,
          ).integerValue(BigNumber.ROUND_DOWN)}`,
          `----`,
          `Normalised source fee amount ${normalisedSourceFee.toFixed(0)}`,
          `Normalised target fee amount ${normalisedTargetFee.toFixed(0)}`,
          `Source fee amount ${sourceFee.toString()}`,
          `Target fee amount ${targetFee.toString()}`,
          `Fee taken from Source token ${collectFeeFromSourceToken}`,
          `Fee take from Target token ${!collectFeeFromSourceToken}`,
          `----`,
          `Normalised target position debt ${targetPosition.debt.normalisedAmount.toString()}`,
          `Normalised target position collateral ${targetPosition.collateral.normalisedAmount.toString()}`,
          `Target position debt ${targetPosition.debt.amount.toString()}`,
          `Target position collateral ${targetPosition.collateral.amount.toString()}`,
          `----`,
          `Oracle price ${oraclePrice.toString()}`,
          `New Position Multiple ${targetPosition.riskRatio.multiple}`,
        ],
        'Output: ',
      )
    }

    return {
      position: targetPosition,
      delta: {
        debt: this._denormaliseAmount(debtDelta, this.debt.precision).integerValue(
          BigNumber.ROUND_DOWN,
        ),
        collateral: this._denormaliseAmount(
          collateralDelta,
          this.collateral.precision,
        ).integerValue(BigNumber.ROUND_DOWN),
        flashloanAmount: amountToFlashloan,
      },
      swap: {
        fromTokenAmount,
        minToTokenAmount,
        tokenFee: collectFeeFromSourceToken ? sourceFee : targetFee,
        collectFeeFrom: collectFeeFromSourceToken ? 'sourceToken' : 'targetToken',
        sourceToken: isIncreasingRisk
          ? { symbol: this.debt.symbol, precision: this.debt.precision }
          : { symbol: this.collateral.symbol, precision: this.collateral.precision },
        targetToken: isIncreasingRisk
          ? { symbol: this.collateral.symbol, precision: this.collateral.precision }
          : { symbol: this.debt.symbol, precision: this.debt.precision },
      },
      flags: {
        requiresFlashloan: isFlashloanRequired,
        isIncreasingRisk,
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
