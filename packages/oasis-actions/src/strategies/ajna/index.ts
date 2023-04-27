import { depositBorrow } from './depositBorrow'
import { earn } from './earn'
import { multiply } from './multiply'
import { open } from './open'
import { paybackWithdraw } from './paybackWithdraw'

export const ajna = {
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
  multiply,
}
