import { borrow as SparkBorrow, SparkBorrowOperation } from './borrow/borrow'
import { deposit as SparkDeposit, SparkDepositOperation } from './borrow/deposit'

const borrow = {
  borrow: SparkBorrow,
  deposit: SparkDeposit,
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
