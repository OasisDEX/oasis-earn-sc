import { AaveV2AdjustDownOperation, adjustRiskDown } from './adjust-risk-down'
import { AaveV2AdjustUpOperation, adjustRiskUp } from './adjust-risk-up'
import { borrow, BorrowV2Operation } from './borrow'
import { AaveV2CloseOperation, close } from './close'
import { AaveV2DepositOperation, deposit } from './deposit'
import { AaveV2DepositBorrowOperation, depositBorrow } from './deposit-borrow'
import { AaveV2OpenOperation, open } from './open'
import { AaveV2OpenDepositBorrowOperation, openDepositAndBorrow } from './open-deposit-and-borrow'
import { AaveV2PaybackWithdrawOperation, paybackWithdraw } from './payback-withdraw'

export type { AAVEStrategyAddresses } from './addresses'

export type AaveV2Operations = {
  adjustRiskDown: AaveV2AdjustDownOperation
  adjustRiskUp: AaveV2AdjustUpOperation
  borrow: BorrowV2Operation
  close: AaveV2CloseOperation
  deposit: AaveV2DepositOperation
  depositBorrow: AaveV2DepositBorrowOperation
  open: AaveV2OpenOperation
  openDepositAndBorrow: AaveV2OpenDepositBorrowOperation
  paybackWithdraw: AaveV2PaybackWithdrawOperation
}

export const aaveV2Operations = {
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
