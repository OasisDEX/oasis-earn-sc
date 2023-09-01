import { AaveLikeDepositBorrow, depositBorrow } from './borrow/deposit-borrow'
import { AaveLikeOpenDepositBorrow, openDepositBorrow } from './borrow/open-deposit-borrow'
import { AaveLikePaybackWithdraw, paybackWithdraw } from './borrow/payback-withdraw'
import { AaveLikeOpen, open } from './multiply/open'

type AaveLike = {
  borrow: {
    depositBorrow: AaveLikeDepositBorrow
    openDepositBorrow: AaveLikeOpenDepositBorrow
    paybackWithdraw: AaveLikePaybackWithdraw
  }
  multiply: {
    open: AaveLikeOpen
  }
}

export const aaveLike: AaveLike = {
  borrow: {
    depositBorrow,
    openDepositBorrow,
    paybackWithdraw,
  },
  multiply: {
    open,
  },
}
