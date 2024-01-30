import {
  depositBorrow as morphoDepositBorrow,
  MorphoDepositBorrowStrategy,
} from './borrow/deposit-borrow'
import { MorphoOpenBorrowStrategy, open as morphoblueOpenDepositBorrow } from './borrow/open'
import {
  MorphoPaybackWithdrawStrategy,
  paybackWithdraw as morphoPaybackWithdraw,
} from './borrow/payback-withdraw'
import { adjustMultiply, MorphoAdjustRiskStrategy } from './multiply/adjust'
import { MorphoOpenMultiplyStrategy, openMultiply } from './multiply/open'
import { MorphoCloseStrategy, closeMultiply } from './multiply/close'

export const morphoblue: {
  borrow: {
    depositBorrow: MorphoDepositBorrowStrategy
    openDepositBorrow: MorphoOpenBorrowStrategy
    paybackWithdraw: MorphoPaybackWithdrawStrategy
  }
  multiply: {
    open: MorphoOpenMultiplyStrategy
    close: MorphoCloseStrategy
    adjust: MorphoAdjustRiskStrategy
  }
} = {
  borrow: {
    openDepositBorrow: morphoblueOpenDepositBorrow,
    depositBorrow: morphoDepositBorrow,
    paybackWithdraw: morphoPaybackWithdraw,
  },
  multiply: {
    open: openMultiply,
    adjust: adjustMultiply,
    close: closeMultiply
  }
}
