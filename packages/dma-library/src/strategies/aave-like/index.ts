import { AaveLikeDepositBorrow, depositBorrow } from './borrow/deposit-borrow'
import { AaveLikeOpenDepositBorrow, openDepositBorrow } from './borrow/open-deposit-borrow'
import { AaveLikePaybackWithdraw, paybackWithdraw } from './borrow/payback-withdraw'

type AaveLike = {
  borrow: {
    depositBorrow: AaveLikeDepositBorrow
    openDepositBorrow: AaveLikeOpenDepositBorrow
    paybackWithdraw: AaveLikePaybackWithdraw
  }
}

export const aaveLike: AaveLike = {
  borrow: {
    depositBorrow,
    openDepositBorrow,
    paybackWithdraw,
  },
}
