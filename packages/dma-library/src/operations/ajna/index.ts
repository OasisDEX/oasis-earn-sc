export { AjnaStrategyAddresses } from './addresses'
import { adjustRiskDown, AjnaAdjustRiskDownOperation } from './adjust-risk-down'
import { adjustRiskUp, AjnaAdjustRiskUpOperation } from './adjust-risk-up'
import { AjnaOpenOperation, open } from './open'

export type AjnaOperations = {
  open: AjnaOpenOperation
  adjustRiskUp: AjnaAdjustRiskUpOperation
  adjustRiskDown: AjnaAdjustRiskDownOperation
}

export const ajnaOperations: AjnaOperations = {
  open,
  adjustRiskUp,
  adjustRiskDown,
}
