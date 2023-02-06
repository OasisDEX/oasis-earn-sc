import { adjust } from './adjust'
import { changeDebt } from './changeDebt'
import { close } from './close'
import { depositBorrow } from './depositBorrow'
import { getCurrentPosition } from './getCurrentPosition'
import { open } from './open'
import { openDepositAndBorrowDebt } from './openDepositAndBorrowDebt'
import { paybackWithdraw } from './paybackWithdraw'
export { AaveVersion } from './getCurrentPosition'

export const aave = {
  open: open,
  close: close,
  adjust: adjust,
  view: getCurrentPosition,
  changeDebt: changeDebt,
  depositBorrow,
  paybackWithdraw: paybackWithdraw,
  openDepositAndBorrowDebt: openDepositAndBorrowDebt,
}
