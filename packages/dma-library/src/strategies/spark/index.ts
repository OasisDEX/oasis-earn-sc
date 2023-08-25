import { depositBorrow as sparkDepositBorrow, SparkDepositBorrow } from './borrow/deposit-borrow'
import {
  openDepositBorrow as sparkOpenDepositBorrow,
  SparkOpenDepositBorrow,
} from './borrow/open-deposit-borrow'

export const spark: {
  depositBorrow: SparkDepositBorrow
  openDepositBorrow: SparkOpenDepositBorrow
} = {
  depositBorrow: sparkDepositBorrow,
  openDepositBorrow: sparkOpenDepositBorrow,
}
