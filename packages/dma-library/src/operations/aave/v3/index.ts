import type { AAVEV3StrategyAddresses } from './addresses'
import { AaveV3AdjustDownOperation, adjustRiskDown } from './adjust-risk-down'
import { AaveV3AdjustUpOperation, adjustRiskUp } from './adjust-risk-up'
import { AaveV3CloseOperation, close } from './close'
import { AaveV3OpenOperation, open } from './open'
import { AaveV3PaybackWithdrawOperation, paybackWithdraw } from './payback-withdraw'

export type { AAVEV3StrategyAddresses }

export type AaveV3Operations = {
  adjustRiskDown: AaveV3AdjustDownOperation
  adjustRiskUp: AaveV3AdjustUpOperation
  close: AaveV3CloseOperation
  open: AaveV3OpenOperation
  paybackWithdraw: AaveV3PaybackWithdrawOperation
}

export const aaveV3Operations = {
  adjustRiskDown,
  adjustRiskUp,
  close,
  open,
  paybackWithdraw,
}
