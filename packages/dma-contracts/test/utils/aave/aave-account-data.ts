import BigNumber from 'bignumber.js'

export interface AaveAccountData {
  totalCollateralETH: BigNumber
  totalDebtETH: BigNumber
  availableBorrowsETH: BigNumber
  currentLiquidationThreshold: BigNumber
  ltv: BigNumber
  healthFactor: BigNumber
}
