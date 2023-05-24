import { FEE_BASE, ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import { denormaliseAmount, normaliseAmount } from '@domain/src/utils'
import BigNumber from 'bignumber.js'

import { Delta, IPosition, IPositionV2 } from './position'
import { IRiskRatio } from './risk-ratio'

// TODO:
// 1. Remove flashloan from calcs [DONE]
// 2. Create use case specific flashloan calculations [DONE]
// 3. Wrap with adjustToLTV and adjustToCollateralisationRatio

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
    isFlashloanRequired?: boolean
    collectSwapFeeFrom?: 'sourceToken' | 'targetToken'
    debug?: boolean
  }
}

export interface ISimulationV2 {
  position: IPosition
  delta: Delta
}

export function adjustToLTV(
  position: IPositionV2,
  targetRiskRatio: IRiskRatio,
  params: AdjustToParams,
): ISimulationV2 {}

export function adjustToCollateralisationRatio() {}

export function adjustToTargetRiskRatio(
  position: IPositionV2,
  targetRiskRatio: IRiskRatio,
  params: AdjustToParams,
): ISimulationV2 {
  const targetLTV = targetRiskRatio.loanToValue

  let isIncreasingRisk = false
  if (targetLTV.gt(position.riskRatio.loanToValue)) {
    isIncreasingRisk = true
  }

  const { toDeposit, fees, prices, slippage } = params
  const { collectSwapFeeFrom = 'sourceToken', isFlashloanRequired = true } = params.options || {}
  const collectFeeFromSourceToken = collectSwapFeeFrom === 'sourceToken'
  const collectFeeFromTargetToken = !collectFeeFromSourceToken

  /**
   * C_W  Collateral in wallet to top-up or seed position
   * D_W  Debt token in wallet to top-up or seed position
   * */
  const collateralDepositedByUser = normaliseAmount(
    toDeposit.collateral || ZERO,
    position.collateral.precision || TYPICAL_PRECISION,
  )
  const debtTokensDepositedByUser = normaliseAmount(
    toDeposit?.debt || ZERO,
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

  /** Always is in the direction of how many units of collateral does 1 unit of debt buy you */
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

  const debtDelta = debtDeltaPreFlashloanFee
    .times(ONE.plus(isFlashloanRequired ? flashloanFee : ZERO))
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
        ? calculateFee(debtDelta, oazoFee.toNumber())
        : calculateFee(collateralDelta, oazoFee.toNumber())
    ).integerValue(BigNumber.ROUND_DOWN)
  }
  if (collectFeeFromTargetToken) {
    normalisedTargetFee = (
      isIncreasingRisk
        ? calculateFee(collateralDelta, oazoFee.toNumber())
        : calculateFee(debtDelta, oazoFee.toNumber())
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
