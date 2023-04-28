import { depositBorrow } from './deposit-borrow'
import { earn } from './earn'
import { open } from './open'
import { paybackWithdraw } from './payback-withdraw'

export const ajna: {
  borrow: {
    open: typeof open
    paybackWithdraw: typeof paybackWithdraw
    depositBorrow: typeof depositBorrow
  }
  open: typeof open
  paybackWithdraw: typeof paybackWithdraw
  depositBorrow: typeof depositBorrow
  earn: typeof earn
} = {
  borrow: {
    open,
    paybackWithdraw,
    depositBorrow,
  },
  // @deprecated: use borrow.open
  open,
  // @deprecated: use borrow.paybackWithdraw
  paybackWithdraw,
  // @deprecated: use borrow.depositBorrow
  depositBorrow,
  earn,
}
