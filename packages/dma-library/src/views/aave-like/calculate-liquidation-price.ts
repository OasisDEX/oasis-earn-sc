import { ONE, ZERO } from '@dma-common/constants'
import type BigNumber from 'bignumber.js'

function NaNIsZero(number: BigNumber) {
  return number.isNaN() ? ZERO : number
}

export interface LiquidationPriceParams {
  liquidationRatio: BigNumber
  debtAmount: BigNumber
  debtPrecision: number
  collateralAmount: BigNumber
  collateralPrecision: number
}

export interface LiquidationPriceResult {
  liquidationPriceInDebt: BigNumber
  liquidationPriceInCollateral: BigNumber
}
export const calculateLiquidationPrice = ({
  liquidationRatio,
  debtAmount,
  debtPrecision,
  collateralAmount,
  collateralPrecision,
}: LiquidationPriceParams): LiquidationPriceResult => {
  const normalizedCollateral = collateralAmount.dividedBy(10 ** collateralPrecision)
  const normalizedDebt = debtAmount.dividedBy(10 ** debtPrecision)

  const liquidationPriceInDebt = NaNIsZero(
    normalizedDebt.div(normalizedCollateral.times(liquidationRatio)),
  )

  const liquidationPriceInCollateral = liquidationPriceInDebt.isZero()
    ? ZERO
    : NaNIsZero(ONE.div(liquidationPriceInDebt))

  return {
    liquidationPriceInDebt,
    liquidationPriceInCollateral,
  }
}
