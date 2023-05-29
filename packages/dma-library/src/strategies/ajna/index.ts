import { AjnaDepositBorrowStrategy, depositBorrow } from './deposit-borrow'
import { AjnaClaimCollateralStrategy, claimCollateral } from './earn/claim-collateral'
import { AjnaDepositAndAdjustStrategy, depositAndAdjust } from './earn/deposit-adjust'
import { AjnaOpenEarnStrategy, open as openEarn } from './earn/open'
import { AjnaWithdrawAndAdjustStrategy, withdrawAndAdjust } from './earn/withdraw-adjust'
import { adjustMultiply, AjnaAdjustRiskStrategy } from './multiply/adjust'
import { AjnaOpenMultiplyStrategy, openMultiply } from './multiply/open'
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
    claimCollateral: AjnaClaimCollateralStrategy
  }
  multiply: {
    open: AjnaOpenMultiplyStrategy
    adjust: AjnaAdjustRiskStrategy
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
  },
}
