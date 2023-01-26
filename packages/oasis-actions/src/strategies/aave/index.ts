import { adjust } from './adjust'
import { close } from './close'
import { depositBorrow } from './depositBorrow'
import { getCurrentPosition } from './getCurrentPosition'
import { open } from './open'
import { paybackWithdraw } from './paybackWithdraw'
import { simpleDepositBorrow } from './simpleDepositBorrow'

export const aave = {
  open: open,
  close: close,
  adjust: adjust,
  view: getCurrentPosition,
  depositBorrow,
  paybackWithdraw: paybackWithdraw,
  simpleDepositBorrow: simpleDepositBorrow,
}
