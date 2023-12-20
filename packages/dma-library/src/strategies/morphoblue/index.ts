import {
  depositBorrow as morphoDepositBorrow,
  MorphoDepositBorrowStrategy,
} from './borrow/deposit-borrow'
import { MorphoOpenBorrowStrategy, open as morphoblueOpenDepositBorrow } from './borrow/open'
import {
  MorphoPaybackWithdrawStrategy,
  paybackWithdraw as morphoPaybackWithdraw,
} from './borrow/payback-withdraw'

export const morphoblue: {
  borrow: {
    depositBorrow: MorphoDepositBorrowStrategy
    openDepositBorrow: MorphoOpenBorrowStrategy
    paybackWithdraw: MorphoPaybackWithdrawStrategy
  }
  // multiply: {
  //   open: MorphoBlueOpen
  //   close: MorphoBlueClose
  //   adjust: MorphoBlueAdjust
  // }
} = {
  borrow: {
    openDepositBorrow: morphoblueOpenDepositBorrow,
    depositBorrow: morphoDepositBorrow,
    paybackWithdraw: morphoPaybackWithdraw,
  },
}
