export { AjnaStrategyAddresses } from './addresses'
import { AjnaOpenOperation, open as ajnaOpen } from './open'

export type AjnaOperations = {
  open: AjnaOpenOperation
}

export const ajnaOperations: AjnaOperations = {
  open: ajnaOpen,
}
