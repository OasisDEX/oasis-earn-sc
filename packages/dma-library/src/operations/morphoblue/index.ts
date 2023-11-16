import { borrow as morphoBlueBorrow, MorphoBlueBorrowOperation } from './borrow/borrow'
import { deposit as morphoBlueDeposit, MorphoBlueDepositOperation } from './borrow/deposit'
import {
  depositBorrow as morphoBlueDepositBorrow,
  MorphoBlueDepositBorrowOperation,
} from './borrow/deposit-borrow'
import {
  MorphoBlueOpenDepositBorrowOperation,
  openDepositBorrow as morphoBlueOpenDepositBorrow,
} from './borrow/open-deposit-and-borrow'
import {
  MorphoBluePaybackWithdrawOperation,
  paybackWithdraw as morphoBluePaybackWithdraw,
} from './borrow/payback-withdraw'
import {
  adjustRiskDown as morphoBlueAdjustRiskDown,
  MorphoBlueAdjustDownOperation,
} from './multiply/adjust-risk-down'
import {
  adjustRiskUp as morphoBlueAdjustRiskUp,
  MorphoBlueAdjustUpOperation,
} from './multiply/adjust-risk-up'
import { close as morphoBlueClose, MorphoBlueCloseOperation } from './multiply/close'
import { MorphoBlueOpenOperation, open as morphoBlueOpen } from './multiply/open'

const borrow = {
  borrow: morphoBlueBorrow,
  deposit: morphoBlueDeposit,
  depositBorrow: morphoBlueDepositBorrow,
  openDepositBorrow: morphoBlueOpenDepositBorrow,
  paybackWithdraw: morphoBluePaybackWithdraw,
}
const multiply = {
  open: morphoBlueOpen,
  close: morphoBlueClose,
  adjustRiskUp: morphoBlueAdjustRiskUp,
  adjustRiskDown: morphoBlueAdjustRiskDown,
}

export type MorphoBlueBorrowOperations = {
  borrow: MorphoBlueBorrowOperation
  deposit: MorphoBlueDepositOperation
  depositBorrow: MorphoBlueDepositBorrowOperation
  openDepositBorrow: MorphoBlueOpenDepositBorrowOperation
  paybackWithdraw: MorphoBluePaybackWithdrawOperation
}

export type MorphoBlueMultiplyOperations = {
  open: MorphoBlueOpenOperation
  close: MorphoBlueCloseOperation
  adjustRiskUp: MorphoBlueAdjustUpOperation
  adjustRiskDown: MorphoBlueAdjustDownOperation
}

export type MorphoBlueOperations = {
  borrow: MorphoBlueBorrowOperations
  multiply: MorphoBlueMultiplyOperations
}

export const morphoBlueOperations: MorphoBlueOperations = {
  borrow,
  multiply,
}
