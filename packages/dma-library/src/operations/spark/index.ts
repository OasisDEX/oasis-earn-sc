import { borrow as sparkBorrow, SparkBorrowOperation } from './borrow/borrow'
import { deposit as sparkDeposit, SparkDepositOperation } from './borrow/deposit'
import {
  depositBorrow as sparkDepositBorrow,
  SparkDepositBorrowOperation,
} from './borrow/deposit-borrow'
import {
  openDepositBorrow as sparkOpenDepositBorrow,
  SparkOpenDepositBorrowOperation,
} from './borrow/open-deposit-and-borrow'
import {
  paybackWithdraw as sparkPaybackWithdraw,
  SparkPaybackWithdrawOperation,
} from './borrow/payback-withdraw'
import { open as sparkOpen, SparkOpenOperation } from './multiply/open'

const borrow = {
  borrow: sparkBorrow,
  deposit: sparkDeposit,
  depositBorrow: sparkDepositBorrow,
  openDepositBorrow: sparkOpenDepositBorrow,
  paybackWithdraw: sparkPaybackWithdraw,
}
const multiply = {
  open: sparkOpen,
  close: {},
  adjustRiskDown: {},
  adjustRiskUp: {},
}

export type SparkBorrowOperations = {
  borrow: SparkBorrowOperation
  deposit: SparkDepositOperation
  depositBorrow: SparkDepositBorrowOperation
  openDepositBorrow: SparkOpenDepositBorrowOperation
  paybackWithdraw: SparkPaybackWithdrawOperation
}

export type SparkMultiplyOperations = {
  open: SparkOpenOperation
  close: any
  adjustRiskDown: any
  adjustRiskUp: any
}

export type SparkOperations = {
  borrow: SparkBorrowOperations
  multiply: SparkMultiplyOperations
}

export const sparkOperations: SparkOperations = {
  borrow,
  multiply,
}
