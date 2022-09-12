import BigNumber from 'bignumber.js'

import { ONE, ZERO } from '../constants'
import { logDebug } from '../index'

interface IPositionBalance {
  amount: BigNumber
  denomination?: string
}

interface IPositionCategory {
  liquidationThreshold: BigNumber
  maxLoanToValue: BigNumber
  dustLimit: BigNumber
}

interface IBasePosition {
  collateral: IPositionBalance
  debt: IPositionBalance
  category: IPositionCategory
}

interface IPositionChangeReturn {
  targetPosition: IPosition
  debtDelta: BigNumber
  collateralDelta: BigNumber
  amountToBeSwappedOrPaidback: BigNumber
  flashloanAmount: BigNumber
  fee: BigNumber
  isFlashloanRequired: boolean
}

// TODO: consider multi-collateral positions
interface IPositionAdjustParams {
  depositedByUser?: {
    collateral?: BigNumber
    debt?: BigNumber
  }
  fees: {
    oazo: BigNumber
    oazoFeeBase: BigNumber
    flashLoan: BigNumber
  }
  prices: {
    oracle: BigNumber
    market: BigNumber
    oracleFLtoDebtToken?: BigNumber
  }
  slippage: BigNumber
  /* Max Loan-to-Value when translating Flashloaned DAI into Debt tokens (EG ETH) */
  maxLoanToValueFL?: BigNumber
  /* For AAVE this would be ETH. For Maker it would be DAI (although strictly speaking USD) */
  collectFeeFromCollateralTokenOverride?: boolean
  debug?: boolean
}

export interface IPosition extends IBasePosition {
  minimumConfigurableLTV: BigNumber
  loanToValueRatio: BigNumber
  healthFactor: BigNumber
  liquidationPrice: BigNumber
  multiple: BigNumber
  adjustToTargetLTV: (targetLTV: BigNumber, params: IPositionAdjustParams) => IPositionChangeReturn
  adjustToTargetMultiple: (
    targetMultiple: BigNumber,
    params: IPositionAdjustParams,
  ) => IPositionChangeReturn
}

export class Position implements IPosition {
  public debt: IPositionBalance
  public collateral: IPositionBalance
  public category: IPositionCategory
  private _oraclePriceForCollateralDebtExchangeRate: BigNumber

  constructor(
    debt: IPositionBalance,
    collateral: IPositionBalance,
    oraclePrice: BigNumber,
    category: IPositionCategory,
  ) {
    this.debt = debt
    this.collateral = collateral
    this._oraclePriceForCollateralDebtExchangeRate = oraclePrice
    this.category = category
  }

  public get minimumConfigurableLTV(): BigNumber {
    return BigNumber.max(this.category.dustLimit, this.debt.amount).div(
      this.collateral.amount.times(this._oraclePriceForCollateralDebtExchangeRate),
    )
  }

  public get loanToValueRatio() {
    return this.debt.amount.div(
      this.collateral.amount.times(this._oraclePriceForCollateralDebtExchangeRate),
    )
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

  public get multiple() {
    return ONE.div(ONE.minus(this.loanToValueRatio))
  }

  /**
   * Calculates the target (or desired) state of a position
   *
   * Maths breakdown: {@link https://www.notion.so/oazo/Multiply-Calculations-950cb04838d84e4aaa529a280a9e050e}
   * Concrete scenarios: {@link https://docs.google.com/spreadsheets/d/1ZB0dlQbjgi7eM-cSyGowWlZCKG-326pWZeHxZAPFOT0/edit?usp=sharing}
   *
   * @returns A position's change in debt, change in collateral and whether a flashloan is necessary to achieve the change
   */
  adjustToTargetLTV(targetLTV: BigNumber, params: IPositionAdjustParams): IPositionChangeReturn {
    const {
      depositedByUser,
      fees,
      prices,
      slippage,
      maxLoanToValueFL: _maxLoanToValueFL,
      collectFeeFromCollateralTokenOverride,
      debug,
    } = params

    /**
     * C_W  Collateral in wallet to top-up or seed position
     * D_W  Debt token in wallet to top-up or seed position
     * */
    const collateralDepositedByUser = depositedByUser?.collateral || ZERO
    const debtDenominatedTokensDepositedByUser = depositedByUser?.debt || ZERO

    /**
     * These values are based on the initial state of the position.
     * If it's a new position then these values will be whatever the
     * user decides to seed the position with.
     *
     * C_C  Current collateral
     * D_C  Current debt
     * */
    const currentCollateral = (this.collateral.amount || ZERO).plus(collateralDepositedByUser)
    const currentDebt = (this.debt.amount || ZERO).minus(debtDenominatedTokensDepositedByUser)

    /**
     * The Oracle price is what we use to convert a positions collateral into the same
     * denomination/units as the position's Debt. Different protocols use different
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
    const marketPriceAdjustedForSlippage = marketPrice.times(ONE.plus(slippage))

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
    const oazoFeeBase = fees.oazoFeeBase
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
          `Collateral deposited by User: ${collateralDepositedByUser.toString()}`,
          `Debt denominated tokens deposited by User: ${debtDenominatedTokensDepositedByUser.toString()}`,

          `Current collateral inc. top-up/seed: ${currentCollateral.toString()}`,
          `Current debt inc. top-up/seed: ${currentDebt.toString()}`,

          `Oracle price: ${oraclePrice.toString()}`,
          `Oracle Price FL-to-Debt token: ${oraclePriceFLtoDebtToken.toString()}`,
          `Market price: ${marketPrice.toString()}`,
          `Slippage: ${slippage.toFixed(4)}`,
          `Market price adj. slippage: ${marketPriceAdjustedForSlippage.toString()}`,

          `Oazo fee: ${oazoFee.toFixed(4)}`,
          `Flashloan fee: ${flashloanFee.toFixed(4)}`,

          `Liquidation threshold: ${liquidationThreshold.toFixed(4)}`,
          `Max Loan-to-Value when opening: ${maxLoanToValue.toFixed(4)}`,
          `Max Loan-to-Value when converting flashloaned DAI to Debt denominated tokens: ${maxLoanToValueFL.toFixed(
            4,
          )}`,

          `Target loan-to-value: ${targetLTV.toString()}`,
        ],
        'Calculate Position Params: ',
      )
    }

    /**
     * Amount to be swapped (increase/open) or paid back (decrease) after accounting for flashloan fees - if required
     *
     * X = \frac{D_C\cdot P_{MS} - T_{LTV}\cdot C_C\cdot P_O\cdot P_{MS}}{((T_{LTV}\cdot (1 -F_O)\cdot P_O) - (1 +F_F)\cdot P_{MS})}
     * */
    const amountToBeSwappedOrPaidback = currentDebt
      .times(marketPriceAdjustedForSlippage)
      .minus(
        targetLTV.times(currentCollateral).times(oraclePrice).times(marketPriceAdjustedForSlippage),
      )
      .div(
        targetLTV
          .times(ONE.minus(oazoFee))
          .times(oraclePrice)
          .minus(ONE.plus(flashloanFee).times(marketPriceAdjustedForSlippage)),
      )
      .integerValue(BigNumber.ROUND_DOWN)

    /**
     * Is a flashloan required to reach the target state for the position?
     *
     * Y represents the available liquidity in the position
     *
     * If Y is less than X where X is the amount of debt that's needed to be generate
     * the target position state then a flashloan is required
     *
     * Y=(C_C\cdot P_O) \cdot LTV_{MAX} - D_C
     * */
    const isFlashloanRequired = currentCollateral
      .times(oraclePrice)
      .times(this.category.maxLoanToValue)
      .minus(currentDebt)
      .lt(amountToBeSwappedOrPaidback)

    /**
     * Finally, we can compute the deltas in debt & collateral
     *
     * ΔD  Debt delta
     * \Delta D = X \cdot (1+F_F)
     *
     * ΔC  Collateral delta
     * \Delta C = X \cdot (1 - F_O) / P_{MS}
     * */
    const debtDelta = amountToBeSwappedOrPaidback.times(
      ONE.plus(isFlashloanRequired ? flashloanFee : ZERO),
    )

    const collateralDelta = amountToBeSwappedOrPaidback
      .times(ONE.minus(oazoFee))
      .div(marketPriceAdjustedForSlippage)

    /**
     *
     * Flashloan amount
     *
     * X_B Amount to flashloan or payback
     */
    const amountToFlashloan = isFlashloanRequired
      ? debtDelta
          .minus(debtDenominatedTokensDepositedByUser)
          .times(oraclePriceFLtoDebtToken)
          .div(maxLoanToValueFL)
          .integerValue(BigNumber.ROUND_DOWN)
      : ZERO

    const isIncreaseAdjustment = amountToBeSwappedOrPaidback.gte(ZERO)
    let collectFeeFromBaseToken = isIncreaseAdjustment
    if (collectFeeFromCollateralTokenOverride) {
      collectFeeFromBaseToken = false
    }

    const fee = collectFeeFromBaseToken
      ? this._calculateFee(amountToBeSwappedOrPaidback, oazoFee, oazoFeeBase)
      : this._calculateFee(collateralDelta, oazoFee, oazoFeeBase)

    if (debug) {
      logDebug(
        [
          `Is flashloan required: ${isFlashloanRequired}`,
          `Amount to flashloan: ${amountToFlashloan}`,
          `Amount to be swapped or paid back: ${amountToBeSwappedOrPaidback.toString()}`,
          `Debt delta: ${debtDelta.toString()}`,
          `Collateral delta: ${collateralDelta.toString()}`,
          `Fee amount ${fee.toString()}`,
          `Fee taken from Base token ${collectFeeFromBaseToken}`,
          `Fee take from Collateral token ${!collectFeeFromBaseToken}`,
        ],
        'Generate Target Position Values: ',
      )
    }

    const targetPosition = this._createTargetPosition(
      debtDelta,
      collateralDelta,
      oraclePrice,
      currentDebt,
      currentCollateral,
    )

    return {
      targetPosition,
      debtDelta,
      collateralDelta,
      amountToBeSwappedOrPaidback: amountToBeSwappedOrPaidback,
      flashloanAmount: amountToFlashloan,
      fee,
      isFlashloanRequired,
    }
  }

  adjustToTargetMultiple(
    targetMultiple: BigNumber,
    params: IPositionAdjustParams,
  ): IPositionChangeReturn {
    return this.adjustToTargetLTV(ONE.minus(ONE.div(targetMultiple)), params)
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
      amount: newCollateralAmount,
      denomination: this.collateral.denomination,
    }

    const newDebtAmount = currentDebt.plus(debtDelta)
    const newDebt = { amount: newDebtAmount, denomination: this.debt.denomination }

    const newPosition = new Position(newDebt, newCollateral, oraclePrice, this.category)

    return newPosition
  }

  private _calculateFee(amount: BigNumber, fee: BigNumber, feeBase: BigNumber): BigNumber {
    return amount.times(fee.times(feeBase)).div(fee.times(feeBase).plus(feeBase)).abs()
  }
}
