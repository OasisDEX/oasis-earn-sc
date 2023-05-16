import type { AAVEV3StrategyAddresses } from './addresses'
import { adjustRiskDown } from './adjust-risk-down'
import { adjustRiskUp } from './adjust-risk-up'
import { close } from './close'
import { open as aaveV3Open } from './open'
import { paybackWithdraw } from './payback-withdraw'

export type { AAVEV3StrategyAddresses }

export type AaveV3Operations = {
  adjustRiskDown: any
  adjustRiskUp: any
  close: any
  open: any
  paybackWithdraw: any
}

export const aaveV3Operations = {
  adjustRiskDown,
  adjustRiskUp,
  close,
  open: aaveV3Open,
  paybackWithdraw,
}
