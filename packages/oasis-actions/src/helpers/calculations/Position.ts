import BigNumber from 'bignumber.js'
import { Optional } from 'utility-types'

import { ONE, TYPICAL_PRECISION, ZERO } from '../constants'
import { logDebug } from '../index'
import { IRiskRatio, RiskRatio } from './RiskRatio'

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

  public toString(): string {
    return `${this.amount.toFixed(this.precision)} ${this.symbol}`
  }

  public get normalisedAmount() {
    return this.amount.times(10 ** (TYPICAL_PRECISION - this.precision))
  }
}

interface IPositionCategory {
  liquidationThreshold: BigNumber
  maxLoanToValue: BigNumber
  dustLimit: BigNumber
}

export interface IBasePosition {
  collateral: IPositionBalance
  debt: IPositionBalance
  category: IPositionCategory
}

type Delta = { debt: BigNumber; collateral: BigNumber; flashloanAmount: BigNumber }
export type Swap = {
  fromTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  sourceTokenFee: BigNumber
  targetTokenFee: BigNumber
}
type Flags = { requiresFlashloan: boolean; isIncreasingRisk: boolean }

export interface IPositionChange {
  position: IPosition
  delta: Delta
  swap: Swap
  flags: Flags
}

// TODO: consider multi-collateral positions
interface IPositionChangeParams {
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
    market: BigNumber
    oracleFLtoDebtToken?: BigNumber
  }
  slippage: BigNumber

  /* For AAVE this would be ETH. For Maker it would be DAI (although strictly speaking USD) */
  collectSwapFeeFrom?: 'sourceToken' | 'targetToken'
  debug?: boolean
}

export interface IPosition extends IBasePosition {
  minConfigurableRiskRatio: (marketPriceAccountingForSlippage: BigNumber) => IRiskRatio
  riskRatio: IRiskRatio
  healthFactor: BigNumber
  liquidationPrice: BigNumber
  adjustToTargetRiskRatio: (
    targetRiskRatio: IRiskRatio,
    params: IPositionChangeParams,
  ) => IPositionChange
}

export class Position implements IPosition {
  public debt: PositionBalance
  public collateral: PositionBalance
  public category: IPositionCategory
  private _feeBase: BigNumber = new BigNumber(10000)
  private _oraclePriceForCollateralDebtExchangeRate: BigNumber

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

  public minConfigurableRiskRatio(marketPriceAccountingForSlippage: BigNumber): IRiskRatio {
    const debtDelta = this.category.dustLimit.minus(this.debt.amount)

    const ltv = this.category.dustLimit.div(
      this._normaliseAmount(debtDelta, this.debt.precision || TYPICAL_PRECISION)
        .div(marketPriceAccountingForSlippage)
        .plus(this.collateral.normalisedAmount)
        .times(this._oraclePriceForCollateralDebtExchangeRate),
    )
    return new RiskRatio(ltv, RiskRatio.TYPE.LTV)
  }

  public get riskRatio() {
    const ltv = this.debt.normalisedAmount.div(
      this.collateral.normalisedAmount.times(this._oraclePriceForCollateralDebtExchangeRate),
    )

    return new RiskRatio(ltv.isNaN() || !ltv.isFinite() ? ZERO : ltv, RiskRatio.TYPE.LTV)
  }

  public get healthFactor() {
    return this.collateral.amount
      .times(this.category.liquidationThreshold)
      .times(this._oraclePriceForCollateralDebtExchangeRate)
      .div(this.debt.amount)
  }

  public get liquidationPrice() {
    return this.debt.amount.div(this.collateral.amount.times(this.category.liquidationThreshold))
  }

  /**
   * Calculates the target (or desired) state of a position
   * We must convert all values to the same 18 decimal precision to ensure the maths works as expected
   *
   * Maths breakdown: {@linkhttps://www.notion.so/oazo/Oasis-Maths-cceaa36d5c2b49a7b5129105cee1d35f#608e831f54fc4557bf004af7c453f865}
   * Concrete scenarios: {@link https://docs.google.com/spreadsheets/d/1ZB0dlQbjgi7eM-cSyGowWlZCKG-326pWZeHxZAPFOT0/edit?usp=sharing}
   *
   * @returns A position's change in debt, change in collateral and whether a flashloan is necessary to achieve the change
   */
  adjustToTargetRiskRatio(
    targetRiskRatio: IRiskRatio,
    params: IPositionChangeParams,
  ): IPositionChange {
    const targetLTV = targetRiskRatio.loanToValue
    let isIncreasingRisk = false

    if (targetLTV.gt(this.riskRatio.loanToValue)) {
      isIncreasingRisk = true
    }

    const { depositedByUser, fees, prices, slippage, flashloan, debug } = params
    const { maxLoanToValueFL: _maxLoanToValueFL } = flashloan
    params.collectSwapFeeFrom = params.collectSwapFeeFrom ?? 'sourceToken'
    const collectFeeFromSourceToken = params.collectSwapFeeFrom === 'sourceToken'

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
    const currentCollateral = (this.collateral.normalisedAmount || ZERO).plus(
      collateralDepositedByUser,
    )
    const currentDebt = (this.debt.normalisedAmount || ZERO).minus(debtTokensDepositedByUser)

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

          `Normalised current collateral inc. top-up/seed: ${currentCollateral.toString()}`,
          `Normalised current debt inc. top-up/seed: ${currentDebt.toString()}`,

          `Oracle price: ${oraclePrice.toString()}`,
          `Oracle Price FL-to-Debt token: ${oraclePriceFLtoDebtToken.toString()}`,
          `Market price: ${marketPrice.toString()}`,
          `Slippage: ${slippage.toFixed(4)}`,
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
        ],
        'Params: ',
      )
    }

    /**
     * Swap or swapped amount after fees
     *
     * X = \frac{D_C\cdot P_{MS} - T_{LTV}\cdot C_C\cdot P_O\cdot P_{MS}}{((T_{LTV}\cdot (1 -F_O)\cdot P_O) - (1 +F_F)\cdot P_{MS})}
     * */
    const swapOrSwappedAmount = currentDebt
      .times(marketPriceAdjustedForSlippage)
      .minus(
        targetLTV.times(currentCollateral).times(oraclePrice).times(marketPriceAdjustedForSlippage),
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
    const isFlashloanRequiredForIncrease = currentCollateral
      .times(oraclePrice)
      .times(this.category.maxLoanToValue)
      .minus(currentDebt)
      .lt(swapOrSwappedAmount)

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
    const debtDeltaPreFlashloanFee = swapOrSwappedAmount.div(
      shouldIncreaseDebtDeltaToAccountForFees ? ONE.minus(oazoFee.div(this._feeBase)) : ONE,
    )

    const collateralDelta = swapOrSwappedAmount
      .div(marketPriceAdjustedForSlippage)
      .div(isIncreasingRisk ? ONE : ONE.minus(oazoFee.div(this._feeBase)))
      .integerValue(BigNumber.ROUND_DOWN)

    /**
     * Is a flashloan required to reach the target state for the position when decreasing?
     *
     * */
    const isFlashloanRequiredForDecrease = this.category.maxLoanToValue.lte(
      currentDebt.div(
        collateralDelta.plus(currentCollateral).times(marketPriceAdjustedForSlippage),
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
    const amountToFlashloan = debtDelta
      .minus(flashloanTokenIsSameAsDebt ? debtTokensDepositedByUser : ZERO)
      .times(oraclePriceFLtoDebtToken)
      .div(maxLoanToValueFL)
      .integerValue(BigNumber.ROUND_DOWN)

    /*
     * Account for fees being collected from either
     * The sourceToken or targetToken in the swap
     */
    let sourceFee = ZERO
    let targetFee = ZERO
    if (collectFeeFromSourceToken) {
      sourceFee = (
        isIncreasingRisk
          ? this._calculateFee(debtDelta, oazoFee)
          : this._calculateFee(collateralDelta, oazoFee)
      ).integerValue(BigNumber.ROUND_DOWN)
    }
    if (!collectFeeFromSourceToken) {
      targetFee = (
        isIncreasingRisk
          ? this._calculateFee(collateralDelta, oazoFee)
          : this._calculateFee(debtDelta, oazoFee)
      ).integerValue(BigNumber.ROUND_DOWN)
    }

    let fromTokenAmount
    let minToTokenAmount
    if (isIncreasingRisk) {
      fromTokenAmount = debtDelta
      minToTokenAmount = collateralDelta
    } else {
      fromTokenAmount = collateralDelta.abs()
      minToTokenAmount = debtDelta.abs()
    }

    const targetPosition = this._createTargetPosition(
      debtDelta,
      collateralDelta,
      oraclePrice,
      currentDebt,
      currentCollateral,
    )

    if (debug) {
      logDebug(
        [
          `Is flashloan required: ${isFlashloanRequired}`,
          `Amount to flashloan: ${amountToFlashloan}`,
          `----`,
          `Swap or Swapped Amount: ${swapOrSwappedAmount.toString()}`,
          `From token amount: ${fromTokenAmount.toString()}`,
          `From token amount after fees: ${fromTokenAmount.minus(sourceFee).toString()}`,
          `From token: ${
            isIncreasingRisk ? targetPosition.debt.symbol : targetPosition.collateral.symbol
          }`,
          `Min To token amount: ${minToTokenAmount.toString()}`,
          `To token: ${
            isIncreasingRisk ? targetPosition.collateral.symbol : targetPosition.debt.symbol
          }`,
          `----`,
          `Debt delta: ${debtDelta.toString()}`,
          `Collateral delta: ${collateralDelta.toString()}`,
          `----`,
          `Source fee amount ${sourceFee.toString()}`,
          `Target fee amount ${targetFee.toString()}`,
          `Fee taken from Source token ${collectFeeFromSourceToken}`,
          `Fee take from Target token ${!collectFeeFromSourceToken}`,
          `----`,
          `Target position debt ${targetPosition.debt.amount.toString()}`,
          `Target position collateral ${targetPosition.collateral.amount.toString()}`,
        ],
        'Output: ',
      )
    }

    return {
      position: targetPosition,
      delta: { debt: debtDelta, collateral: collateralDelta, flashloanAmount: amountToFlashloan },
      swap: {
        fromTokenAmount,
        minToTokenAmount,
        sourceTokenFee: sourceFee.integerValue(),
        targetTokenFee: targetFee,
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
      ),
    }

    const newDebtAmount = this._denormaliseAmount(
      currentDebt.plus(debtDelta),
      this.debt.precision || TYPICAL_PRECISION,
    )
    const newDebt = { ...this.debt, amount: newDebtAmount }

    const newPosition = new Position(
      new PositionBalance(newDebt),
      new PositionBalance(newCollateral),
      oraclePrice,
      this.category,
    )

    return newPosition
  }

  private _calculateFee(amount: BigNumber, fee: BigNumber): BigNumber {
    return amount.times(fee).div(fee.plus(this._feeBase)).abs()
  }

  private _normaliseAmount(amount: BigNumber, precision: number): BigNumber {
    return amount.times(10 ** (TYPICAL_PRECISION - precision))
  }

  private _denormaliseAmount(amount: BigNumber, precision: number): BigNumber {
    return amount.div(10 ** (TYPICAL_PRECISION - precision))
  }
}
