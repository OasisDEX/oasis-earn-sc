import BigNumber from 'bignumber.js'

import { ONE, ZERO } from '../constants'
import { logDebug } from '../index'
import { IRiskRatio, RiskRatio } from './RiskRatio'

interface IVaultBalance {
  amount: BigNumber
  denomination?: string
}

interface IVaultCategory {
  liquidationThreshold: BigNumber
  maxLoanToValue: BigNumber
  dustLimit: BigNumber
}

export interface IBaseVault {
  collateral: IVaultBalance
  debt: IVaultBalance
  category: IVaultCategory
}

type Delta = { debt: BigNumber; collateral: BigNumber; flashloanAmount?: BigNumber }
export type Swap = { fromTokenAmount: BigNumber; toTokenAmount: BigNumber; fee: BigNumber }
type Flags = { usesFlashloan: boolean; isIncreasingRisk: boolean }

export interface IVaultChange {
  vault: IVault
  delta: Delta
  swap: Swap
  flags: Flags
}

// TODO: consider multi-collateral vaults
interface IVaultChangeParams {
  depositedByUser?: {
    collateral?: BigNumber
    debt?: BigNumber
  }
  fees: {
    oazo: BigNumber
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
  collectFeeAfterSwap?: boolean
  debug?: boolean
}

export interface IVault extends IBaseVault {
  minConfigurableRiskRatio: (marketPriceAccountingForSlippage: BigNumber) => IRiskRatio
  riskRatio: IRiskRatio
  healthFactor: BigNumber
  liquidationPrice: BigNumber
  adjustToTargetRiskRatio: (targetRiskRatio: IRiskRatio, params: IVaultChangeParams) => IVaultChange
}

export class Vault implements IVault {
  public debt: IVaultBalance
  public collateral: IVaultBalance
  public category: IVaultCategory
  private _feeBase: BigNumber = new BigNumber(10000)
  private _oraclePriceForCollateralDebtExchangeRate: BigNumber

  constructor(
    debt: IVaultBalance,
    collateral: IVaultBalance,
    oraclePrice: BigNumber,
    category: IVaultCategory,
  ) {
    this.debt = debt
    this.collateral = collateral
    this._oraclePriceForCollateralDebtExchangeRate = oraclePrice
    this.category = category
  }

  public minConfigurableRiskRatio(marketPriceAccountingForSlippage: BigNumber): IRiskRatio {
    const debtDelta = this.category.dustLimit.minus(this.debt.amount)

    const ltv = this.category.dustLimit.div(
      debtDelta
        .div(marketPriceAccountingForSlippage)
        .plus(this.collateral.amount)
        .times(this._oraclePriceForCollateralDebtExchangeRate),
    )
    return new RiskRatio(ltv, RiskRatio.TYPE.LTV)
  }

  public get riskRatio() {
    const ltv = this.debt.amount.div(
      this.collateral.amount.times(this._oraclePriceForCollateralDebtExchangeRate),
    )
    return new RiskRatio(ltv, RiskRatio.TYPE.LTV)
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
   * Calculates the target (or desired) state of a vault
   *
   * Maths breakdown: {@linkhttps://www.notion.so/oazo/Oasis-Maths-cceaa36d5c2b49a7b5129105cee1d35f#608e831f54fc4557bf004af7c453f865}
   * Concrete scenarios: {@link https://docs.google.com/spreadsheets/d/1ZB0dlQbjgi7eM-cSyGowWlZCKG-326pWZeHxZAPFOT0/edit?usp=sharing}
   *
   * @returns A vault's change in debt, change in collateral and whether a flashloan is necessary to achieve the change
   */
  adjustToTargetRiskRatio(targetRiskRatio: IRiskRatio, params: IVaultChangeParams): IVaultChange {
    const targetLTV = targetRiskRatio.loanToValue

    const {
      depositedByUser,
      fees,
      prices,
      slippage,
      maxLoanToValueFL: _maxLoanToValueFL,
      collectFeeAfterSwap,
      debug,
    } = params

    /**
     * C_W  Collateral in wallet to top-up or seed vault
     * D_W  Debt token in wallet to top-up or seed vault
     * */
    const collateralDepositedByUser = depositedByUser?.collateral || ZERO
    const debtDenominatedTokensDepositedByUser = depositedByUser?.debt || ZERO

    /**
     * These values are based on the initial state of the vault.
     * If it's a new vault then these values will be whatever the
     * user decides to seed the vault with.
     *
     * C_C  Current collateral
     * D_C  Current debt
     * */
    const currentCollateral = (this.collateral.amount || ZERO).plus(collateralDepositedByUser)
    const currentDebt = (this.debt.amount || ZERO).minus(debtDenominatedTokensDepositedByUser)

    /**
     * The Oracle price is what we use to convert a vault's collateral into the same
     * denomination/units as the vault's Debt. Different protocols use different
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
     * is converted to a Vault's target collateral.
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
     * Liquidation threshold is the ratio at which a vault can be liquidated
     *
     * LT Liquidation threshold for vault
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
          `Oazo feeBase: ${this._feeBase.toFixed(4)}`,
          `Flashloan fee: ${flashloanFee.toFixed(4)}`,

          `Liquidation threshold: ${liquidationThreshold.toFixed(4)}`,
          `Max Loan-to-Value when opening: ${maxLoanToValue.toFixed(4)}`,
          `Max Loan-to-Value when converting flashloaned DAI to Debt denominated tokens: ${maxLoanToValueFL.toFixed(
            4,
          )}`,

          `Target loan-to-value: ${targetLTV.toString()}`,
        ],
        'Params: ',
      )
    }

    /**
     * Amount to be swapped (increase/open) or paid back (decrease) after accounting for flashloan fees - if required
     *
     * X = \frac{D_C\cdot P_{MS} - T_{LTV}\cdot C_C\cdot P_O\cdot P_{MS}}{((T_{LTV}\cdot (1 -F_O)\cdot P_O) - (1 +F_F)\cdot P_{MS})}
     * */
    const amountToBeSwappedOrPaidback_X = currentDebt
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
     * Is a flashloan required to reach the target state for the vault?
     *
     * Y represents the available liquidity in the vault
     *
     * If Y is less than X where X is the amount of debt that's needed to be generate
     * the target vault state then a flashloan is required
     *
     * Y=(C_C\cdot P_O) \cdot LTV_{MAX} - D_C
     * */
    const isFlashloanRequiredForIncrease = currentCollateral
      .times(oraclePrice)
      .times(this.category.maxLoanToValue)
      .minus(currentDebt)
      .lt(amountToBeSwappedOrPaidback_X)

    /**
     * Finally, we can compute the deltas in debt & collateral
     *
     * ΔD  Debt delta
     * \Delta D = X \cdot (1+F_F)
     *
     * ΔC  Collateral delta
     * \Delta C = X \cdot (1 - F_O) / P_{MS}
     * */
    const debtDeltaPreFlashloanFee = amountToBeSwappedOrPaidback_X

    const collateralDelta = amountToBeSwappedOrPaidback_X
      .times(ONE.minus(oazoFee.div(this._feeBase)))
      .div(marketPriceAdjustedForSlippage)

    /**
     * Is a flashloan required to reach the target state for the vault when decreasing?
     *
     * */
    const isFlashloanRequiredForDecrease = this.category.maxLoanToValue.lte(
      currentDebt.div(
        collateralDelta.plus(currentCollateral).times(marketPriceAdjustedForSlippage),
      ),
    )

    const isFlashloanRequired = isFlashloanRequiredForIncrease || isFlashloanRequiredForDecrease

    const debtDelta = debtDeltaPreFlashloanFee.times(
      ONE.plus(isFlashloanRequired ? flashloanFee : ZERO),
    )

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

    const isRiskIncreasingAdjustment = amountToBeSwappedOrPaidback_X.gte(ZERO)
    /*
     * Protocol Base Assets EG USD for Maker or ETH for AAVE.
     */
    let collectFeeFromBaseToken = isRiskIncreasingAdjustment
    if (collectFeeAfterSwap && isRiskIncreasingAdjustment) {
      collectFeeFromBaseToken = false
    }

    if (collectFeeAfterSwap && !isRiskIncreasingAdjustment) {
      collectFeeFromBaseToken = true
    }

    const fee = collectFeeFromBaseToken
      ? this._calculateFee(amountToBeSwappedOrPaidback_X, oazoFee)
      : this._calculateFee(collateralDelta, oazoFee)

    const fromTokenAmount = isRiskIncreasingAdjustment
      ? amountToBeSwappedOrPaidback_X
      : amountToBeSwappedOrPaidback_X
          .negated()
          .times(ONE.minus(oazoFee.div(this._feeBase)))
          .div(marketPriceAdjustedForSlippage)
    const toTokenAmount = isRiskIncreasingAdjustment
      ? collateralDelta
      : amountToBeSwappedOrPaidback_X.negated()

    const targetVault = this._createTargetVault(
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
          `Our unknown X: ${amountToBeSwappedOrPaidback_X.toString()}`,
          `From token amount: ${fromTokenAmount.toString()}`,
          `From token: ${
            isRiskIncreasingAdjustment
              ? targetVault.debt.denomination
              : targetVault.collateral.denomination
          }`,
          `To token amount: ${toTokenAmount.toString()}`,
          `To token: ${
            isRiskIncreasingAdjustment
              ? targetVault.collateral.denomination
              : targetVault.debt.denomination
          }`,
          `Debt delta: ${debtDelta.toString()}`,
          `Collateral delta: ${collateralDelta.toString()}`,
          `Fee amount ${fee.toString()}`,
          `Fee taken from Base token ${collectFeeFromBaseToken}`,
          `Fee take from Collateral token ${!collectFeeFromBaseToken}`,
          `Target vault debt ${targetVault.debt.amount.toString()}`,
          `Target vault collateral ${targetVault.collateral.amount.toString()}`,
        ],
        'Output: ',
      )
    }

    return {
      vault: targetVault,
      delta: { debt: debtDelta, collateral: collateralDelta, flashloanAmount: amountToFlashloan },
      swap: {
        fromTokenAmount,
        toTokenAmount,
        fee,
      },
      flags: {
        usesFlashloan: isFlashloanRequired,
        isIncreasingRisk: isRiskIncreasingAdjustment,
      },
    }
  }

  private _createTargetVault(
    debtDelta: BigNumber,
    collateralDelta: BigNumber,
    oraclePrice: BigNumber,
    currentDebt: BigNumber,
    currentCollateral: BigNumber,
  ): IVault {
    const newCollateralAmount = currentCollateral.plus(collateralDelta)
    const newCollateral = {
      amount: newCollateralAmount,
      denomination: this.collateral.denomination,
    }

    const newDebtAmount = currentDebt.plus(debtDelta)
    const newDebt = { amount: newDebtAmount, denomination: this.debt.denomination }

    const newVault = new Vault(newDebt, newCollateral, oraclePrice, this.category)

    return newVault
  }

  private _calculateFee(amount: BigNumber, fee: BigNumber): BigNumber {
    return amount.times(fee).div(fee.plus(this._feeBase)).abs()
  }
}
