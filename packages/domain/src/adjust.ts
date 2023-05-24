import { FEE_BASE, ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { IPositionBalance, IPositionTransitionParams } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'

import { FLASHLOAN_SAFETY_MARGIN } from './constants'
import {
  denormaliseAmount,
  IBaseSimulatedTransition,
  IPositionCategory,
  normaliseAmount,
} from './position'
import { IRiskRatio } from './risk-ratio'
import { calculateFee } from './utils'

// TODO:
// 1. Remove flashloan from calcs
// 2. Create domain specific flashloan calculations
// 3. Wrap with adjustToLTV and adjustToCollateralisationRatio

export function adjustToTargetRiskRatio(
  position: {
    debt: IPositionBalance
    collateral: IPositionBalance
    riskRatio: IRiskRatio
    category: IPositionCategory
  },
  targetRiskRatio: IRiskRatio,
  params: IPositionTransitionParams,
): IBaseSimulatedTransition {
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

export function calculateFlashloan(
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
  // const targetLTV = targetRiskRatio.loanToValue
  //
  // let isIncreasingRisk = false
  // if (targetLTV.gt(position.riskRatio.loanToValue)) {
  //   isIncreasingRisk = true
  // }

  const { fees, prices, flashloan } = params
  const { maxLoanToValueFL: _maxLoanToValueFL } = flashloan
  // params.collectSwapFeeFrom = params.collectSwapFeeFrom ?? 'sourceToken'
  // const collectFeeFromSourceToken = params.collectSwapFeeFrom === 'sourceToken'
  // const collectFeeFromTargetToken = !collectFeeFromSourceToken
  //
  // /**
  //  * C_W  Collateral in wallet to top-up or seed position
  //  * D_W  Debt token in wallet to top-up or seed position
  //  * */
  // const collateralDepositedByUser = normaliseAmount(
  //   depositedByUser?.collateralInWei || ZERO,
  //   position.collateral.precision || TYPICAL_PRECISION,
  // )
  // const debtTokensDepositedByUser = normaliseAmount(
  //   depositedByUser?.debtInWei || ZERO,
  //   position.debt.precision || TYPICAL_PRECISION,
  // )

  // /**
  //  * These values are based on the initial state of the position.
  //  * If it's a new position then these values will be whatever the
  //  * user decides to seed the position with.
  //  *
  //  * C_C  Current collateral
  //  * D_C  Current debt
  //  * */
  // const normalisedCurrentCollateral = (
  //   normaliseAmount(
  //     position.collateral.amount,
  //     position.collateral.precision || TYPICAL_PRECISION,
  //   ) || ZERO
  // ).plus(collateralDepositedByUser)
  // const normalisedCurrentDebt = (
  //   normaliseAmount(position.debt.amount, position.debt.precision || TYPICAL_PRECISION) || ZERO
  // ).minus(debtTokensDepositedByUser)

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
  // const oraclePrice = prices.oracle
  const oraclePriceFLtoDebtToken = prices?.oracleFLtoDebtToken || ONE
  // Always is in the direction of how many units of collateral does 1 unit of debt buy you
  // const marketPrice = prices.market

  // const marketPriceAdjustedForSlippage = marketPrice.times(
  //   isIncreasingRisk ? ONE.plus(slippage) : ONE.minus(slippage),
  // )

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
  // const oazoFee = fees.oazo
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
  // const unknownVarX = normalisedCurrentDebt
  //   .times(marketPriceAdjustedForSlippage)
  //   .minus(
  //     targetLTV
  //       .times(normalisedCurrentCollateral)
  //       .times(oraclePrice)
  //       .times(marketPriceAdjustedForSlippage),
  //   )
  //   .div(
  //     targetLTV
  //       .times(ONE.minus(oazoFee.div(FEE_BASE)))
  //       .times(oraclePrice)
  //       .minus(ONE.plus(flashloanFee).times(marketPriceAdjustedForSlippage)),
  //   )
  //   .integerValue(BigNumber.ROUND_DOWN)

  // /**
  //  * Is a flashloan required to reach the target state for the position?
  //  *
  //  * Y represents the available liquidity in the positio
  //  *
  //  * If Y is less than X where X is the amount of debt that's needed to be generate
  //  * the target position state then a flashloan is required
  //  *
  //  * Y=(C_C\cdot P_O) \cdot LTV_{MAX} - D_C
  //  * */
  // const isFlashloanRequiredForIncrease = normalisedCurrentCollateral
  //   .times(oraclePrice)
  //   .times(position.category.maxLoanToValue)
  //   .minus(normalisedCurrentDebt)
  //   .lt(unknownVarX)

  /**
   * Finally, we can compute the deltas in debt & collateral
   *
   * ΔD  Debt delta
   * \Delta D = X \cdot (1+F_F)
   *
   * ΔC  Collateral delta
   * \Delta C = X \cdot (1 - F_O) / P_{MS}
   * */
  // const shouldIncreaseDebtDeltaToAccountForFees = isIncreasingRisk && collectFeeFromSourceToken
  // const debtDeltaPreFlashloanFee = unknownVarX.div(
  //   shouldIncreaseDebtDeltaToAccountForFees ? ONE.minus(oazoFee.div(FEE_BASE)) : ONE,
  // )

  // const collateralDelta = unknownVarX
  //   .div(marketPriceAdjustedForSlippage)
  //   .div(isIncreasingRisk ? ONE : ONE.minus(oazoFee.div(FEE_BASE)))
  //   .integerValue(BigNumber.ROUND_DOWN)
  //
  // /**
  //  * Is a flashloan required to reach the target state for the position when decreasing?
  //  *
  //  * */
  // const isFlashloanRequiredForDecrease = position.category.maxLoanToValue.lte(
  //   normalisedCurrentDebt.div(
  //     collateralDelta.plus(normalisedCurrentCollateral).times(marketPriceAdjustedForSlippage),
  //   ),
  // )

  // const isFlashloanRequired = isFlashloanRequiredForIncrease || isFlashloanRequiredForDecrease

  // const debtDelta = debtDeltaPreFlashloanFee
  //   .times(ONE.plus(isFlashloanRequired ? flashloanFee : ZERO))
  //   .integerValue(BigNumber.ROUND_DOWN)

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
