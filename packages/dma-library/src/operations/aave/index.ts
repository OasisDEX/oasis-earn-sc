// Borrow
import { AaveV2BorrowOperation, borrow as aaveV2Borrow } from './borrow/v2/borrow'
import { AaveV2DepositOperation, deposit as aaveV2Deposit } from './borrow/v2/deposit'
import {
  AaveV2DepositBorrowOperation,
  depositBorrow as aaveV2DepositBorrow,
} from './borrow/v2/deposit-borrow'
import {
  AaveV2OpenDepositBorrowOperation,
  openDepositAndBorrow as aaveV2OpenDepositBorrow,
} from './borrow/v2/open-deposit-and-borrow'
import {
  AaveV2PaybackWithdrawOperation,
  paybackWithdraw as aaveV2PaybackWithdraw,
} from './borrow/v2/payback-withdraw'
import { AaveV3BorrowOperation, borrow as aaveV3Borrow } from './borrow/v3/borrow'
import { AaveV3DepositOperation, deposit as aaveV3Deposit } from './borrow/v3/deposit'
import {
  AaveV3DepositBorrowOperation,
  depositBorrow as aaveV3DepositBorrow,
} from './borrow/v3/deposit-borrow'
import {
  AaveV3OpenDepositBorrowOperation,
  openDepositBorrow as aaveV3OpenDepositBorrow,
} from './borrow/v3/open-deposit-and-borrow'
import {
  AaveV3PaybackWithdrawOperation,
  paybackWithdraw as aaveV3PaybackWithdraw,
} from './borrow/v3/payback-withdraw'
// Multiply
import {
  AaveV2AdjustDownOperation,
  adjustRiskDown as aaveV2AdjustRiskDown,
} from './multiply/v2/adjust-risk-down'
import {
  AaveV2AdjustUpOperation,
  adjustRiskUp as aaveV2AdjustRiskUp,
} from './multiply/v2/adjust-risk-up'
import { AaveV2CloseOperation, close as aaveV2Close } from './multiply/v2/close'
import { AaveV2OpenOperation, open as aaveV2Open } from './multiply/v2/open'
import {
  AaveV3AdjustDownOperation,
  adjustRiskDown as aaveV3AdjustRiskDown,
} from './multiply/v3/adjust-risk-down'
import {
  AaveV3AdjustUpOperation,
  adjustRiskUp as aaveV3AdjustRiskUp,
} from './multiply/v3/adjust-risk-up'
import { AaveV3CloseOperation, close as aaveV3Close } from './multiply/v3/close'
import { AaveV3OpenOperation, open as aaveV3Open } from './multiply/v3/open'

const borrow = {
  v2: {
    borrow: aaveV2Borrow,
    deposit: aaveV2Deposit,
    depositBorrow: aaveV2DepositBorrow,
    openDepositBorrow: aaveV2OpenDepositBorrow,
    paybackWithdraw: aaveV2PaybackWithdraw,
  },
  v3: {
    borrow: aaveV3Borrow,
    deposit: aaveV3Deposit,
    depositBorrow: aaveV3DepositBorrow,
    openDepositBorrow: aaveV3OpenDepositBorrow,
    paybackWithdraw: aaveV3PaybackWithdraw,
  },
}

const multiply = {
  v2: {
    open: aaveV2Open,
    close: aaveV2Close,
    adjustRiskDown: aaveV2AdjustRiskDown,
    adjustRiskUp: aaveV2AdjustRiskUp,
  },
  v3: {
    open: aaveV3Open,
    close: aaveV3Close,
    adjustRiskDown: aaveV3AdjustRiskDown,
    adjustRiskUp: aaveV3AdjustRiskUp,
  },
}

export type AaveBorrowOperations = {
  v2: {
    borrow: AaveV2BorrowOperation
    deposit: AaveV2DepositOperation
    depositBorrow: AaveV2DepositBorrowOperation
    openDepositBorrow: AaveV2OpenDepositBorrowOperation
    paybackWithdraw: AaveV2PaybackWithdrawOperation
  }
  v3: {
    borrow: AaveV3BorrowOperation
    deposit: AaveV3DepositOperation
    depositBorrow: AaveV3DepositBorrowOperation
    openDepositBorrow: AaveV3OpenDepositBorrowOperation
    paybackWithdraw: AaveV3PaybackWithdrawOperation
  }
}

export type AaveMultiplyOperations = {
  v2: {
    open: AaveV2OpenOperation
    close: AaveV2CloseOperation
    adjustRiskDown: AaveV2AdjustDownOperation
    adjustRiskUp: AaveV2AdjustUpOperation
  }
  v3: {
    open: AaveV3OpenOperation
    close: AaveV3CloseOperation
    adjustRiskDown: AaveV3AdjustDownOperation
    adjustRiskUp: AaveV3AdjustUpOperation
  }
}

export type AaveOperations = {
  borrow: AaveBorrowOperations
  multiply: AaveMultiplyOperations
}

export const aaveOperations: AaveOperations = {
  borrow,
  multiply,
}
