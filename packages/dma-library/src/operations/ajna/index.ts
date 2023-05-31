export { AjnaStrategyAddresses } from './addresses'
import { adjustRiskUp, AjnaAdjustRiskUpOperation } from './adjust-risk-up'
import { AjnaOpenOperation, open } from './open'

export type AjnaOperations = {
  open: AjnaOpenOperation
  adjustRiskUp: AjnaAdjustRiskUpOperation
}

export const ajnaOperations: AjnaOperations = {
  open,
  adjustRiskUp,
}
