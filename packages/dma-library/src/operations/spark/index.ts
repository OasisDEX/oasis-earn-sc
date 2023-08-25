import { borrow as SparkBorrow, SparkBorrowOperation } from './borrow/borrow'
import { deposit as SparkDeposit, SparkDepositOperation } from './borrow/deposit'
import { depositBorrow as SparkDepositBorrow } from './borrow/deposit-borrow'
import { openDepositBorrow as SparkOpenDepositBorrow } from './borrow/open-deposit-and-borrow'
import { paybackWithdraw as SparkPaybackWithdraw } from './borrow/payback-withdraw'

const borrow = {
  borrow: SparkBorrow,
  deposit: SparkDeposit,
  depositBorrow: SparkDepositBorrow,
  openDepositBorrow: SparkOpenDepositBorrow,
  paybackWithdraw: SparkPaybackWithdraw,
}
const multiply = {}

export type SparkOperations = {
  borrow: {
    borrow: SparkBorrowOperation
    deposit: SparkDepositOperation
  }
  // TODO: Add multiply operations once adjusted for balancer
  multiply: object
}

export const sparkOperations = {
  borrow,
  multiply,
}
