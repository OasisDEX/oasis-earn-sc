import { depositBorrow as sparkDepositBorrow, SparkDepositBorrow } from './borrow/deposit-borrow'
import {
  openDepositBorrow as sparkOpenDepositBorrow,
  SparkOpenDepositBorrow,
} from './borrow/open-deposit-borrow'
import {
  paybackWithdraw as sparkPaybackWithdraw,
  SparkPaybackWithdraw,
} from './borrow/payback-withdraw'
import { open as sparkOpen, SparkOpen } from './multiply/open'

export const spark: {
  borrow: {
    depositBorrow: SparkDepositBorrow
    openDepositBorrow: SparkOpenDepositBorrow
    paybackWithdraw: SparkPaybackWithdraw
  }
  multiply: {
    open: SparkOpen
  }
} = {
  borrow: {
    depositBorrow: sparkDepositBorrow,
    openDepositBorrow: sparkOpenDepositBorrow,
    paybackWithdraw: sparkPaybackWithdraw,
  },
  multiply: {
    open: sparkOpen,
  },
}
