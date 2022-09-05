import BigNumber from 'bignumber.js'

import { ONE, ZERO } from '../constants'
import { logDebug } from '../index'

interface IPosition {
  collateral: BigNumber
  debt: BigNumber
  collateralPriceInUSD?: BigNumber
  debtPriceInUSD?: BigNumber
  collateralisationRatio: BigNumber
  liquidationRatio: BigNumber
  multiple: BigNumber
}

export class Position implements IPosition {
  public debt: BigNumber
  public collateral: BigNumber
  public liquidationRatio: BigNumber
  private _oraclePriceForCollateralDebtExchangeRate: BigNumber

  constructor(
    debt: BigNumber,
    collateral: BigNumber,
    oraclePrice: BigNumber,
    liquidationRatio: BigNumber,
  ) {
    this.debt = debt
    this.collateral = collateral
    this._oraclePriceForCollateralDebtExchangeRate = oraclePrice
    this.liquidationRatio = liquidationRatio
  }

  public get collateralisationRatio() {
    return this.collateral.times(this._oraclePriceForCollateralDebtExchangeRate).div(this.debt)
  }

  public get multiple() {
    return ONE.plus(ONE.div(this.collateralisationRatio.minus(ONE)))
  }
}

interface TargetPositionParams {
  addedByUser?: {
    collateral?: BigNumber
    debt?: BigNumber
  }
  currentPosition: IPosition
  targetCollateralRatio: BigNumber
  fees: {
    oazo: BigNumber
    flashLoan: BigNumber
  }
  prices: {
    oracle: BigNumber
    market: BigNumber
  }
  slippage: BigNumber
  debug?: boolean
}

/**
 * Calculates the target (or desired) state of a position
 *
 * Maths breakdown: {@link https://www.notion.so/oazo/Multiply-Calculations-950cb04838d84e4aaa529a280a9e050e}
 * Concrete scenarios: {@link https://docs.google.com/spreadsheets/d/1ZB0dlQbjgi7eM-cSyGowWlZCKG-326pWZeHxZAPFOT0/edit?usp=sharing}
 *
 * @returns A position's change in debt, change in collateral and whether a flashloan is necessary to achieve the change
 */
export function calculateTargetPosition(params: TargetPositionParams): {
  targetPosition: IPosition
  debtDelta: BigNumber
  collateralDelta: BigNumber
  isFlashloanRequired: boolean
} {
  const { addedByUser, currentPosition, targetCollateralRatio, fees, prices, slippage, debug } =
    params

  /**
   * C_W	Collateral in wallet to top-up or seed position
   * D_W	Debt token in wallet to top-up or seed position
   * */
  const seedOrTopupCollateral = addedByUser?.collateral || ZERO
  const seedOrTopupDebt = addedByUser?.debt || ZERO

  /**
   * These values are based on the initial state of the position.
   * If it's a new position then these values will be whatever the
   * user decides to seed the position with.
   *
   * C_C	Current collateral
   * D_C	Current debt
   * */
  const currentCollateral = (currentPosition?.collateral || ZERO).plus(seedOrTopupCollateral)
  const currentDebt = (currentPosition?.collateral || ZERO).plus(seedOrTopupDebt)

  /**
   * The Oracle price is what we use to convert a positions collateral into the same
   * denomination/units as the position's Debt. Different protocols use different
   * base assets.
   * EG:
   * Maker uses DAI
   * AAVE uses ETH
   * Compound uses ETH
   *
   * P_O	Oracle Price
   * P_M	Market Price
   * P_{MS} Market Price adjusted for Slippage
   * */
  const oraclePrice = prices.oracle
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
  const flashloanFee = fees.flashLoan

  if (debug) {
    logDebug(
      [
        `Seed or top-up collateral: ${seedOrTopupCollateral.toFixed(2)}`,
        `Seed or top-up debt: ${seedOrTopupDebt.toFixed(2)}`,
        `Current collateral inc. top-up/seed: ${currentCollateral.toFixed(2)}`,
        `Current debt inc. top-up/seed: ${currentDebt.toFixed(2)}`,
        `Oracle price: ${oraclePrice.toFixed(2)}`,
        `Market price: ${marketPrice.toFixed(2)}`,
        `Slippage: ${slippage.toFixed(4)}`,
        `Market price adj. slippage: ${marketPriceAdjustedForSlippage.toFixed(2)}`,
        `Target collateralisation ratio: ${targetCollateralRatio.toFixed(2)}`,
        `Oazo fee: ${oazoFee.toFixed(4)}`,
        `Flashloan fee: ${flashloanFee.toFixed(4)}`,
      ],
      'Calculate Position Params: ',
    )
  }

  /**
   * Now, we need to calculate the amount of debt the position must generate and swap
   * for collateral to reach the desired (target) collateral ratio.
   *
   * X represents the amount of debt the position must generate (or !!payback if decreasing multiple)
   *
   * X = \frac{(C_C\cdot P_O \cdot P_{MS}) - (T_{CR}\cdot D_C \cdot P_{MS})}{((T_{CR}\cdot (1 +F_F) \cdot P_{MS}) - ((1 -F_O)\cdot  P_O))}
   * */
  const debtDeltaBeforeFlashloanFees = currentCollateral
    .times(oraclePrice)
    .times(marketPriceAdjustedForSlippage)
    .minus(targetCollateralRatio.times(currentDebt).times(marketPriceAdjustedForSlippage))
    .div(
      targetCollateralRatio
        .times(ONE.plus(flashloanFee))
        .times(marketPriceAdjustedForSlippage)
        .minus(ONE.minus(oazoFee).times(oraclePrice)),
    )

  /**
   * Is a flashloan required to reach the target state for the position?
   *
   * Y represents the available liquidity in the position
   *
   * If Y is less than X where X is the amount of debt that needed to be generate
   * the target state for the position then a flashloan is necessary
   *
   * Y=(\frac{C_C\cdot P_O}{LR})-D_C
   * */
  const isFlashloanRequired = currentCollateral
    .times(oraclePrice)
    .div(currentPosition.liquidationRatio)
    .minus(currentDebt)
    .lt(debtDeltaBeforeFlashloanFees)

  /**
   * Finally, we can compute the deltas in debt & collateral
   *
   * ΔD  Debt delta
   * \Delta D = X \cdot (1+F_F)
   *
   * ΔC  Collateral delta
   * \Delta C = X \cdot (1 - F_O) / P_{MS}
   * */
  const debtDelta = debtDeltaBeforeFlashloanFees.times(
    ONE.plus(isFlashloanRequired ? flashloanFee : ZERO),
  )

  const collateralDelta = debtDeltaBeforeFlashloanFees
    .times(ONE.minus(oazoFee))
    .div(marketPriceAdjustedForSlippage)

  if (debug) {
    logDebug(
      [
        `Debt delta before flashloan fees: ${debtDeltaBeforeFlashloanFees.toFixed(2)}`,
        `Is a flashloan required: ${isFlashloanRequired}`,
        `Debt delta: ${debtDelta.toFixed(2)}`,
        `Collateral delta: ${collateralDelta.toFixed(2)}`,
      ],
      'Generate Target Position Values: ',
    )
  }

  const targetPosition = recomputePosition(
    debtDelta,
    collateralDelta,
    oraclePrice,
    currentDebt,
    currentCollateral,
    currentPosition.liquidationRatio,
  )

  return {
    targetPosition,
    debtDelta,
    collateralDelta,
    isFlashloanRequired,
  }
}

function recomputePosition(
  debtDelta: BigNumber,
  collateralDelta: BigNumber,
  oraclePrice: BigNumber,
  currentDebt: BigNumber,
  currentCollateral: BigNumber,
  liquidationRatio: BigNumber,
): IPosition {
  const newCollateralAmount = currentCollateral.plus(collateralDelta)
  const newDebtAmount = currentDebt.plus(debtDelta)

  const newPosition = new Position(
    newDebtAmount,
    newCollateralAmount,
    oraclePrice,
    liquidationRatio,
  )

  return newPosition
}
