import { AaveLikeDepositBorrow, depositBorrow } from './borrow/deposit-borrow'
import { AaveLikeOpenDepositBorrow, openDepositBorrow } from './borrow/open-deposit-borrow'
import { AaveLikePaybackWithdraw, paybackWithdraw } from './borrow/payback-withdraw'
import { AaveLikeAdjust, adjust } from './multiply/adjust'
import { AaveLikeClose, close } from './multiply/close'
import { AaveLikeOpen, open } from './multiply/open'

export * from './migrate'
export { IAdjustStrategy } from './multiply/adjust/types'

type AaveLike = {
  borrow: {
    depositBorrow: AaveLikeDepositBorrow
    openDepositBorrow: AaveLikeOpenDepositBorrow
    paybackWithdraw: AaveLikePaybackWithdraw
  }
  multiply: {
    open: AaveLikeOpen
    close: AaveLikeClose
    adjust: AaveLikeAdjust
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
    close,
    adjust,
  },
}
