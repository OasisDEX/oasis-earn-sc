import { adjustRiskDown } from './adjust-risk-down'
import { adjustRiskUp } from './adjust-risk-up'
import { borrow } from './borrow'
import { close } from './close'
import { deposit } from './deposit'
import { depositBorrow } from './deposit-borrow'
import { open } from './open'
import { openDepositAndBorrow } from './open-deposit-and-borrow'
import { paybackWithdraw } from './payback-withdraw'

export type { AAVEStrategyAddresses } from './addresses'
export const v2 = {
  adjustRiskDown,
  adjustRiskUp,
  borrow,
  close,
  deposit,
  depositBorrow,
  open,
  openDepositAndBorrow,
  paybackWithdraw,
}
