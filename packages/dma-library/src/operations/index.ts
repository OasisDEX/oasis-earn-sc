import {
  adjustRiskDown,
  adjustRiskUp,
  borrow,
  close,
  deposit,
  depositBorrow,
  open,
  openDepositAndBorrow,
  paybackWithdraw,
} from './aave/v2'
import {
  adjustRiskDown as adjustRiskDownV3,
  adjustRiskUp as adjustRiskUpV3,
  close as closeV3,
  open as openV3,
} from './aave/v3'

const aave = {
  v2: {
    adjustRiskDown,
    adjustRiskUp,
    borrow,
    close,
    deposit,
    depositBorrow,
    open,
    openDepositAndBorrow,
    paybackWithdraw,
  },
  v3: {
    adjustRiskDown: adjustRiskDownV3,
    adjustRiskUp: adjustRiskUpV3,
    close: closeV3,
    open: openV3,
  },
}

export const operations = {
  aave,
}
