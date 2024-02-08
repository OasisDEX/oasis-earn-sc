export { SummerStrategyAddresses } from './addresses'
import { adjustRiskDown, AjnaAdjustRiskDownOperation } from './adjust-risk-down'
import { adjustRiskUp, AjnaAdjustRiskUpOperation } from './adjust-risk-up'
import { AjnaCloseToCollateralOperation, closeToCollateral } from './close-to-collateral'
import { AjnaCloseToQuoteOperation, closeToQuote } from './close-to-quote'
import { AjnaOpenOperation, open } from './open'

export type AjnaOperations = {
  open: AjnaOpenOperation
  adjustRiskUp: AjnaAdjustRiskUpOperation
  adjustRiskDown: AjnaAdjustRiskDownOperation
  closeToQuote: AjnaCloseToQuoteOperation
  closeToCollateral: AjnaCloseToCollateralOperation
}

export const ajnaOperations: AjnaOperations = {
  open,
  adjustRiskUp,
  adjustRiskDown,
  closeToQuote,
  closeToCollateral,
}
