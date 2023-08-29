import { depositBorrow as sparkDepositBorrow, SparkDepositBorrow } from './borrow/deposit-borrow'
import {
  openDepositBorrow as sparkOpenDepositBorrow,
  SparkOpenDepositBorrow,
} from './borrow/open-deposit-borrow'
import {
  paybackWithdraw as sparkPaybackWithdraw,
  SparkPaybackWithdraw,
} from './borrow/payback-withdraw'

export const spark: {
  depositBorrow: SparkDepositBorrow
  openDepositBorrow: SparkOpenDepositBorrow
  paybackWithdraw: SparkPaybackWithdraw
} = {
  depositBorrow: sparkDepositBorrow,
  openDepositBorrow: sparkOpenDepositBorrow,
  paybackWithdraw: sparkPaybackWithdraw,
}
