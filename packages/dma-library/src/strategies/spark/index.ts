import { depositBorrowOmni } from '@dma-library/strategies/spark/omni/borrow/deposit-borrow'
import { openDepositBorrowOmni } from '@dma-library/strategies/spark/omni/borrow/open-deposit-borrow'
import { paybackWithdrawOmni } from '@dma-library/strategies/spark/omni/borrow/payback-withdraw'
import { adjustOmni } from '@dma-library/strategies/spark/omni/multiply/adjust'
import { closeOmni } from '@dma-library/strategies/spark/omni/multiply/close'
import { openOmni } from '@dma-library/strategies/spark/omni/multiply/open'

import {
  depositBorrow as sparkDepositBorrow,
  SparkDepositBorrow,
  SparkDepositBorrowOmni,
} from './borrow/deposit-borrow'
import {
  openDepositBorrow as sparkOpenDepositBorrow,
  SparkOpenDepositBorrow,
  SparkOpenDepositBorrowOmni,
} from './borrow/open-deposit-borrow'
import {
  paybackWithdraw as sparkPaybackWithdraw,
  SparkPaybackWithdraw,
  SparkPaybackWithdrawOmni,
} from './borrow/payback-withdraw'
import { adjust as sparkAdjust, SparkAdjust, SparkAdjustOmni } from './multiply/adjust'
import { close as sparkClose, SparkClose, SparkCloseOmni } from './multiply/close'
import { open as sparkOpen, SparkOpen, SparkOpenOmni } from './multiply/open'

export const spark: {
  borrow: {
    depositBorrow: SparkDepositBorrow
    openDepositBorrow: SparkOpenDepositBorrow
    paybackWithdraw: SparkPaybackWithdraw
  }
  multiply: {
    open: SparkOpen
    close: SparkClose
    adjust: SparkAdjust
  }
  omni: {
    borrow: {
      depositBorrow: SparkDepositBorrowOmni
      openDepositBorrow: SparkOpenDepositBorrowOmni
      paybackWithdraw: SparkPaybackWithdrawOmni
    }
    multiply: {
      open: SparkOpenOmni
      close: SparkCloseOmni
      adjust: SparkAdjustOmni
    }
  }
} = {
  borrow: {
    depositBorrow: sparkDepositBorrow,
    openDepositBorrow: sparkOpenDepositBorrow,
    paybackWithdraw: sparkPaybackWithdraw,
  },
  multiply: {
    open: sparkOpen,
    close: sparkClose,
    adjust: sparkAdjust,
  },
  omni: {
    borrow: {
      depositBorrow: depositBorrowOmni,
      openDepositBorrow: openDepositBorrowOmni,
      paybackWithdraw: paybackWithdrawOmni,
    },
    multiply: {
      open: openOmni,
      close: closeOmni,
      adjust: adjustOmni,
    },
  },
}
