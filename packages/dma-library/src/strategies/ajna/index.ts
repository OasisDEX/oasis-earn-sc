import { AjnaDepositBorrowStrategy, depositBorrow } from './deposit-borrow'
import { AjnaDepositAndAdjustStrategy, depositAndAdjust } from './earn/deposit-adjust'
import { AjnaOpenEarnStrategy, open as openEarn } from './earn/open'
import { AjnaWithdrawAndAdjustStrategy, withdrawAndAdjust } from './earn/withdraw-adjust'
import { AjnaOpenBorrowStrategy, open as openBorrow } from './open'
import { AjnaPaybackWithdrawStrategy, paybackWithdraw } from './payback-withdraw'

export const ajna: {
  borrow: {
    open: AjnaOpenBorrowStrategy
    paybackWithdraw: AjnaPaybackWithdrawStrategy
    depositBorrow: AjnaDepositBorrowStrategy
  }
  earn: {
    open: AjnaOpenEarnStrategy
    depositAndAdjust: AjnaDepositAndAdjustStrategy
    withdrawAndAdjust: AjnaWithdrawAndAdjustStrategy
  }
} = {
  borrow: {
    open: openBorrow,
    paybackWithdraw,
    depositBorrow,
  },
  earn: {
    open: openEarn,
    depositAndAdjust,
    withdrawAndAdjust,
  },
}
