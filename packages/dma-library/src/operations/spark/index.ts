import { borrow as SparkBorrow, SparkBorrowOperation } from './borrow/borrow'

const borrow = {
  borrow: SparkBorrow,
}
const multiply = {}

export type SparkOperations = {
  borrow: {
    borrow: SparkBorrowOperation
  }
  multiply: {}
}

export const sparkOperations = {
  borrow,
  multiply,
}
