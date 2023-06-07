import { AjnaDepositBorrowStrategy, depositBorrow } from './borrow/deposit-borrow'
import { AjnaOpenBorrowStrategy, open as openBorrow } from './borrow/open'
import { AjnaPaybackWithdrawStrategy, paybackWithdraw } from './borrow/payback-withdraw'
import { AjnaClaimCollateralStrategy, claimCollateral } from './earn/claim-collateral'
import { AjnaDepositAndAdjustStrategy, depositAndAdjust } from './earn/deposit-adjust'
import { AjnaOpenEarnStrategy, open as openEarn } from './earn/open'
import { AjnaWithdrawAndAdjustStrategy, withdrawAndAdjust } from './earn/withdraw-adjust'
import { adjustMultiply, AjnaAdjustRiskStrategy } from './multiply/adjust'
import { AjnaCloseStrategy, closeMultiply } from './multiply/close'
import { AjnaOpenMultiplyStrategy, openMultiply } from './multiply/open'

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
    claimCollateral: AjnaClaimCollateralStrategy
  }
  multiply: {
    open: AjnaOpenMultiplyStrategy
    adjust: AjnaAdjustRiskStrategy
    close: AjnaCloseStrategy
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
    claimCollateral,
  },
  multiply: {
    open: openMultiply,
    adjust: adjustMultiply,
    close: closeMultiply,
  },
}
