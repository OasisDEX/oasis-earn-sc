import { borrow as SparkBorrow, SparkBorrowOperation } from './borrow/borrow'
import { deposit as SparkDeposit, SparkDepositOperation } from './borrow/deposit'
import { depositBorrow as SparkDepositBorrow } from './borrow/depositBorrow'
import { openDepositBorrow as SparkOpenDepositBorrow } from './borrow/openDepositBorrow'
import { paybackWithdraw as SparkPaybackWithdraw } from './borrow/paybackWithdraw'

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
  multiply: {}
}

export const sparkOperations = {
  borrow,
  multiply,
}
