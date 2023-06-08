import { FEE_BASE, ONE, ZERO } from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import { Amount } from '@domain/amount'
import { determineRiskDirection } from '@domain/utils/risk-direction'
import BigNumber from 'bignumber.js'

import { Delta, IPositionV2, Swap } from './position'
import { createRiskRatio, IRiskRatio } from './risk-ratio'

interface AdjustToParams {
  toDeposit: {
    /** The amount of collateral to deposit */
    collateral: BigNumber
    debt: BigNumber
  }
  fees: {
    /** Typically the fee paid to Oazo when swapping */
    oazo: BigNumber
    /** Fee charged by flashloan provider */
    flashLoan: BigNumber
  }
  prices: {
    /** Oracle price of 1 Collateral Token in Debt Tokens  */
    oracle: BigNumber
    /** Market price of 1 Collateral Token in Debt Tokens  */
    // Always the amount of collateral you can buy with 1 debt token
    market: BigNumber
  }
  slippage: BigNumber
  /** For AAVE this would be ETH. For Maker it would be DAI (although strictly speaking USD) */
  options?: {
    /** Not actively used yet */
    isFlashloanRequired?: boolean
    collectSwapFeeFrom?: 'sourceToken' | 'targetToken'
  }
}

export interface ISimulationV2 {
  position: IPositionV2
  delta: Delta
}

export type WithFlags = { flags: { requiresFlashloan: boolean; isIncreasingRisk: boolean } }

export type WithSwap = {
  swap: Swap
}

export function adjustToTargetRiskRatio(
  position: IPositionV2,
  targetRiskRatio: IRiskRatio,
  params: AdjustToParams,
): ISimulationV2 & WithSwap {
  const targetLTV = targetRiskRatio.loanToValue

  const riskIsIncreasing = determineRiskDirection(targetLTV, position.riskRatio.loanToValue)

  const { toDeposit, fees, prices, slippage } = params
  const { collectSwapFeeFrom = 'sourceToken', isFlashloanRequired = true } = params.options || {}
  const collectFeeFromSourceToken = collectSwapFeeFrom === 'sourceToken'

  /**
   * C_W  Collateral in wallet to top-up or seed position
   * D_W  Debt token in wallet to top-up or seed position
   * */
  const collateralDepositedByUser = new Amount(
    toDeposit.collateral,
    'max',
    position.collateral.precision,
  ).switchPrecisionMode('normalized')

  const debtTokensDepositedByUser = new Amount(
    toDeposit?.debt,
    'max',
    position.debt.precision,
  ).switchPrecisionMode('normalized')

  /**
   * These values are based on the initial state of the position.
   * If it's a new position then these values will be whatever the
   * user decides to seed the position with.
   *
   * C_C  Current collateral
   * D_C  Current debt
   * */

  const normalisedCurrentCollateral = new Amount(
    position.collateral.amount,
    'max',
    position.collateral.precision,
  )
    .switchPrecisionMode('normalized')
    .plus(collateralDepositedByUser)

  const normalisedCurrentDebt = new Amount(position.debt.amount, 'max', position.debt.precision)
    .switchPrecisionMode('normalized')
    .minus(debtTokensDepositedByUser)

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

  /** Always is in the direction of how many units of collateral does 1 unit of debt buy you */
  const marketPrice = prices.market

  const marketPriceAdjustedForSlippage = marketPrice.times(
    riskIsIncreasing ? ONE.plus(slippage) : ONE.minus(slippage),
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
   * Unknown Variable X
   *
   * X = \frac{D_C\cdot P_{MS} - T_{LTV}\cdot C_C\cdot P_O\cdot P_{MS}}{((T_{LTV}\cdot (1 -F_O)\cdot P_O) - (1 +F_F)\cdot P_{MS})}
   * */
  const unknownVarX = normalisedCurrentDebt
    .times(marketPriceAdjustedForSlippage)
    .minus(
      targetLTV
        .times(normalisedCurrentCollateral.toBigNumber())
        .times(oraclePrice)
        .times(marketPriceAdjustedForSlippage),
    )
    .div(
      targetLTV
        .times(ONE.minus(oazoFee.div(FEE_BASE)))
        .times(oraclePrice)
        .minus(ONE.plus(flashloanFee).times(marketPriceAdjustedForSlippage)),
    )

  /**
   * Finally, we can compute the deltas in debt & collateral
   *
   * ΔD  Debt delta
   * \Delta D = X \cdot (1+F_F)
   *
   * ΔC  Collateral delta
   * \Delta C = X \cdot (1 - F_O) / P_{MS}
   * */
  const shouldIncreaseDebtDeltaToAccountForFees = riskIsIncreasing && collectFeeFromSourceToken
  const debtDeltaPreFlashloanFee = unknownVarX.div(
    shouldIncreaseDebtDeltaToAccountForFees ? ONE.minus(oazoFee.div(FEE_BASE)) : ONE,
  )

  const collateralDelta = new Amount(
    unknownVarX.toBigNumber(),
    'normalized',
    position.collateral.precision,
  )
    .div(marketPriceAdjustedForSlippage)
    .div(riskIsIncreasing ? ONE : ONE.minus(oazoFee.div(FEE_BASE)))
    .switchPrecisionMode('max')
    .integerValue(BigNumber.ROUND_DOWN)

  const debtDelta = debtDeltaPreFlashloanFee
    .times(ONE.plus(isFlashloanRequired ? flashloanFee : ZERO))
    .switchPrecisionMode('max')
    .integerValue(BigNumber.ROUND_DOWN)

  return {
    position: buildAdjustedPosition(
      position,
      debtDelta,
      collateralDelta,
      normalisedCurrentDebt,
      normalisedCurrentCollateral,
      oraclePrice,
    ),
    delta: {
      debt: debtDelta.toBigNumber(),
      collateral: collateralDelta.toBigNumber(),
    },
    swap: buildSwapSimulation(position, debtDelta, collateralDelta, oazoFee, {
      isIncreasingRisk: riskIsIncreasing,
      collectSwapFeeFrom,
    }),
  }
}

function buildAdjustedPosition(
  position: IPositionV2,
  debtDelta: Amount,
  collateralDelta: Amount,
  currentDebt: Amount,
  currentCollateral: Amount,
  oraclePrice: BigNumber,
): IPositionV2 {
  const nextDebt = currentDebt.switchPrecisionMode('max').plus(debtDelta)
  const nextCollateral = currentCollateral.switchPrecisionMode('max').plus(collateralDelta)
  const nextDebtAsPositionBalance = {
    ...position.debt,
    amount: nextDebt.toBigNumber(),
  }
  const nextCollateralAsPositionBalance = {
    ...position.collateral,
    amount: nextCollateral.toBigNumber(),
  }

  return {
    debt: nextDebtAsPositionBalance,
    collateral: nextCollateralAsPositionBalance,
    riskRatio: createRiskRatio(nextDebt, nextCollateral, oraclePrice),
  }
}

function buildSwapSimulation(
  position: IPositionV2,
  debtDelta: Amount,
  collateralDelta: Amount,
  oazoFee: BigNumber,
  options: {
    isIncreasingRisk: boolean
    collectSwapFeeFrom: 'sourceToken' | 'targetToken'
  },
) {
  const { isIncreasingRisk, collectSwapFeeFrom } = options

  const fromTokenAmount = isIncreasingRisk
    ? debtDelta.toBigNumber()
    : collateralDelta.toBigNumber().abs()
  const minToTokenAmount = isIncreasingRisk
    ? collateralDelta.toBigNumber()
    : debtDelta.toBigNumber().abs()

  const fromToken = isIncreasingRisk ? position.debt : position.collateral
  const toToken = isIncreasingRisk ? position.collateral : position.debt

  return {
    fromTokenAmount,
    minToTokenAmount,
    tokenFee: determineFee(
      isIncreasingRisk,
      debtDelta,
      collateralDelta,
      oazoFee,
      fromToken,
      toToken,
      collectSwapFeeFrom,
    ),
    collectFeeFrom: collectSwapFeeFrom,
    sourceToken: isIncreasingRisk
      ? { symbol: position.debt.symbol, precision: position.debt.precision }
      : { symbol: position.collateral.symbol, precision: position.collateral.precision },
    targetToken: isIncreasingRisk
      ? { symbol: position.collateral.symbol, precision: position.collateral.precision }
      : { symbol: position.debt.symbol, precision: position.debt.precision },
  }
}

function determineFee(
  isIncreasingRisk: boolean,
  debtDelta: Amount,
  collateralDelta: Amount,
  oazoFee: BigNumber,
  fromToken,
  toToken,
  collectSwapFeeFrom,
) {
  /*
   * Account for fees being collected from either
   * The sourceToken or targetToken in the swap
   */
  const collectFeeFromSourceToken = collectSwapFeeFrom === 'sourceToken'

  const sourceDelta = isIncreasingRisk ? debtDelta : collateralDelta
  const sourcePrecision = isIncreasingRisk
    ? debtDelta.getTokenPrecision()
    : collateralDelta.getTokenPrecision()
  const targetDelta = isIncreasingRisk ? collateralDelta : debtDelta
  const targetPrecision = isIncreasingRisk
    ? collateralDelta.getTokenPrecision()
    : debtDelta.getTokenPrecision()

  const sourceFee = new Amount(
    calculateFee(sourceDelta.toBigNumber(), oazoFee.toNumber()),
    'normalized',
    sourcePrecision,
  )
    .switchPrecisionMode('max')
    .integerValue(BigNumber.ROUND_DOWN)
    .toBigNumber()

  const targetFee = new Amount(
    calculateFee(targetDelta.toBigNumber(), oazoFee.toNumber()),
    'normalized',
    targetPrecision,
  )
    .switchPrecisionMode('max')
    .integerValue(BigNumber.ROUND_DOWN)
    .toBigNumber()

  return collectFeeFromSourceToken ? sourceFee : targetFee
}
