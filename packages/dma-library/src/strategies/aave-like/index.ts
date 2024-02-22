import { depositBorrowOmni } from '@dma-library/strategies/aave-like/omni/borrow/deposit-borrow'
import { openDepositBorrowOmni } from '@dma-library/strategies/aave-like/omni/borrow/open-deposit-borrow'
import { paybackWithdrawOmni } from '@dma-library/strategies/aave-like/omni/borrow/payback-withdraw'
import { adjustOmni } from '@dma-library/strategies/aave-like/omni/multiply/adjust'
import { closeOmni } from '@dma-library/strategies/aave-like/omni/multiply/close'
import { openOmni } from '@dma-library/strategies/aave-like/omni/multiply/open'

import {
  AaveLikeDepositBorrow,
  AaveLikeDepositBorrowOmni,
  depositBorrow,
} from './borrow/deposit-borrow'
import {
  AaveLikeOpenDepositBorrow,
  AaveLikeOpenDepositBorrowOmni,
  openDepositBorrow,
} from './borrow/open-deposit-borrow'
import {
  AaveLikePaybackWithdraw,
  AaveLikePaybackWithdrawOmni,
  paybackWithdraw,
} from './borrow/payback-withdraw'
import { AaveLikeAdjust, AaveLikeAdjustOmni, adjust } from './multiply/adjust'
import { AaveLikeClose, AaveLikeCloseOmni, close } from './multiply/close'
import { AaveLikeOpen, AaveLikeOpenOmni, open } from './multiply/open'

export { IAdjustStrategy } from './multiply/adjust/types'

type AaveLike = {
  borrow: {
    depositBorrow: AaveLikeDepositBorrow
    openDepositBorrow: AaveLikeOpenDepositBorrow
    paybackWithdraw: AaveLikePaybackWithdraw
  }
  multiply: {
    open: AaveLikeOpen
    close: AaveLikeClose
    adjust: AaveLikeAdjust
  }
  omni: {
    borrow: {
      depositBorrow: AaveLikeDepositBorrowOmni
      openDepositBorrow: AaveLikeOpenDepositBorrowOmni
      paybackWithdraw: AaveLikePaybackWithdrawOmni
    }
    multiply: {
      open: AaveLikeOpenOmni
      close: AaveLikeCloseOmni
      adjust: AaveLikeAdjustOmni
    }
  }
}

export const aaveLike: AaveLike = {
  borrow: {
    depositBorrow,
    openDepositBorrow,
    paybackWithdraw,
  },
  multiply: {
    open,
    close,
    adjust,
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
