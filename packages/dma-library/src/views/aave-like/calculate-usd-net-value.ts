import { amountFromWei } from '@dma-common/utils/common'
import BigNumber from 'bignumber.js'

export function calculateUsdNetValue({
  collateralAmount,
  collateralPrecision,
  debtAmount,
  debtPrecision,
  debtTokenPrice,
  collateralTokenPrice,
}: {
  collateralAmount: BigNumber
  collateralPrecision: number
  debtAmount: BigNumber
  debtPrecision: number
  collateralTokenPrice: BigNumber
  debtTokenPrice: BigNumber
}) {
  const collateral = amountFromWei(collateralAmount, collateralPrecision)
  const debt = amountFromWei(debtAmount, debtPrecision)

  // (collateral_amount * collateral_token_oracle_price - debt_token_amount * debt_token_oracle_price) / USDC_oracle_price

  return collateral.times(collateralTokenPrice).minus(debt.times(debtTokenPrice))
}
