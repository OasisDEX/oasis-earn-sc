import {
  open as morphoblueOpenDepositBorrow,
  MorphoOpenBorrowStrategy
} from './borrow/open'

export const morphoblue: {
  borrow: {
    //depositBorrow
    openDepositBorrow: MorphoOpenBorrowStrategy
    //paybackWithdraw
  }
  // multiply: {
  //   open: MorphoBlueOpen
  //   close: MorphoBlueClose
  //   adjust: MorphoBlueAdjust
  // }
} = {
  borrow: {
    openDepositBorrow: morphoblueOpenDepositBorrow,
  },
}
