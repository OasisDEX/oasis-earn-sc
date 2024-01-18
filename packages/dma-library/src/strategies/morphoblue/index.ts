import {
  depositBorrow as morphoDepositBorrow,
  MorphoDepositBorrowStrategy,
} from './borrow/deposit-borrow'
import { MorphoOpenBorrowStrategy, open as morphoblueOpenDepositBorrow } from './borrow/open'
import {
  MorphoPaybackWithdrawStrategy,
  paybackWithdraw as morphoPaybackWithdraw,
} from './borrow/payback-withdraw'
import { MorphoOpenMultiplyStrategy, openMultiply } from './multiply/open'

export const morphoblue: {
  borrow: {
    depositBorrow: MorphoDepositBorrowStrategy
    openDepositBorrow: MorphoOpenBorrowStrategy
    paybackWithdraw: MorphoPaybackWithdrawStrategy
  }
  multiply: {
    open: MorphoOpenMultiplyStrategy
    // close: MorphoBlueClose
    // adjust: MorphoBlueAdjust
  }
} = {
  borrow: {
    openDepositBorrow: morphoblueOpenDepositBorrow,
    depositBorrow: morphoDepositBorrow,
    paybackWithdraw: morphoPaybackWithdraw,
  },
  multiply: {
    open: openMultiply,
  }
}
