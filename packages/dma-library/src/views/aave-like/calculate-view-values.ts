import { amountFromWei, normalizeValue } from '@dma-common/utils/common'
import type BigNumber from 'bignumber.js'

import { calculateLiquidationPrice } from './calculate-liquidation-price'
import { calculateUsdNetValue } from './calculate-usd-net-value'

export function calculateViewValuesForPosition({
  collateralAmount,
  collateralPrecision,
  debtAmount,
  debtPrecision,
  collateralLiquidityRate,
  debtVariableBorrowRate,
  debtTokenPrice,
  collateralTokenPrice,
  category,
}: {
  collateralAmount: BigNumber
  collateralPrecision: number
  debtAmount: BigNumber
  debtPrecision: number
  collateralTokenPrice: BigNumber
  debtTokenPrice: BigNumber
  collateralLiquidityRate: BigNumber
  debtVariableBorrowRate: BigNumber
  category: {
    maxLoanToValue: BigNumber
    liquidationThreshold: BigNumber
  }
}) {
  const collateral = amountFromWei(collateralAmount, collateralPrecision)
  const debt = amountFromWei(debtAmount, debtPrecision)

  // collateral * usdprice * maxLTV - debt * usdprice
  const buyingPower = collateral
    .times(collateralTokenPrice)
    .times(category.maxLoanToValue)
    .minus(debt.times(debtTokenPrice))

  const netValue = calculateUsdNetValue({
    collateralAmount,
    collateralPrecision,
    collateralTokenPrice,
    debtAmount,
    debtPrecision,
    debtTokenPrice,
  })

  const netValueInCollateralToken = netValue.div(collateralTokenPrice)
  const netValueInDebtToken = netValue.div(debtTokenPrice)

  const totalExposure = collateral

  const { liquidationPriceInDebt, liquidationPriceInCollateral } = calculateLiquidationPrice({
    collateralAmount,
    collateralPrecision,
    debtAmount,
    debtPrecision,
    liquidationRatio: category.liquidationThreshold,
  })

  const costOfBorrowingDebt = debtVariableBorrowRate.times(debt).times(debtTokenPrice)
  const profitFromProvidingCollateral = collateralLiquidityRate
    .times(collateral)
    .times(collateralTokenPrice)
  const netBorrowCostPercentage = normalizeValue(
    costOfBorrowingDebt.minus(profitFromProvidingCollateral).div(netValue),
  )

  return {
    collateral,
    debt,
    buyingPower,
    netValue,
    netValueInCollateralToken,
    netValueInDebtToken,
    totalExposure,
    liquidationPriceInDebt,
    liquidationPriceInCollateral,
    netBorrowCostPercentage,
    collateralLiquidityRate,
    debtVariableBorrowRate,
  }
}
