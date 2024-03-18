import {
  depositBorrow as morphoDepositBorrow,
  MorphoDepositBorrowStrategy,
} from './borrow/deposit-borrow'
import { MorphoOpenBorrowStrategy, open as morphoblueOpenDepositBorrow } from './borrow/open'
import {
  MorphoPaybackWithdrawStrategy,
  paybackWithdraw as morphoPaybackWithdraw,
} from './borrow/payback-withdraw'
import { claimRewards, MorphoClaimRewardsStrategy } from './common/claim-rewards'
import { adjustMultiply, MorphoAdjustRiskStrategy } from './multiply/adjust'
import { closeMultiply, MorphoCloseStrategy } from './multiply/close'
import { MorphoOpenMultiplyStrategy, openMultiply } from './multiply/open'

export const morphoblue: {
  borrow: {
    depositBorrow: MorphoDepositBorrowStrategy
    openDepositBorrow: MorphoOpenBorrowStrategy
    paybackWithdraw: MorphoPaybackWithdrawStrategy
  }
  multiply: {
    open: MorphoOpenMultiplyStrategy
    close: MorphoCloseStrategy
    adjust: MorphoAdjustRiskStrategy
  }
  common: {
    claimRewards: MorphoClaimRewardsStrategy
  }
} = {
  borrow: {
    openDepositBorrow: morphoblueOpenDepositBorrow,
    depositBorrow: morphoDepositBorrow,
    paybackWithdraw: morphoPaybackWithdraw,
  },
  multiply: {
    open: openMultiply,
    adjust: adjustMultiply,
    close: closeMultiply,
  },
  common: {
    claimRewards: claimRewards,
  },
}
