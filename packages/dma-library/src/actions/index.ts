import {
  aaveBorrow,
  aaveDeposit,
  aavePayback,
  aaveV3Borrow,
  aaveV3Deposit,
  aaveV3Payback,
  aaveV3SetEMode,
  aaveV3Withdraw,
  aaveWithdraw,
} from './aave'
import {
  ajnaDepositBorrow,
  AjnaDepositBorrowAction,
  ajnaPaybackWithdraw,
  AjnaPaybackWithdrawAction,
} from './ajna'
import {
  positionCreated,
  pullToken,
  returnFunds,
  sendToken,
  setApproval,
  swap,
  takeAFlashLoan,
  unwrapEth,
  wrapEth,
} from './common'
import { openVault } from './maker'

const aave = {
  v2: {
    aaveBorrow,
    aaveDeposit,
    aavePayback,
    aaveWithdraw,
  },
  v3: {
    aaveV3Borrow,
    aaveV3Deposit,
    aaveV3Payback,
    aaveV3Withdraw,
    aaveV3SetEMode,
  },
}

const common = {
  pullToken,
  sendToken,
  setApproval,
  swap,
  returnFunds,
  positionCreated,
  wrapEth,
  unwrapEth,
  takeAFlashLoan,
}

const maker = {
  openVault,
}

const ajna: {
  ajnaPaybackWithdraw: AjnaPaybackWithdrawAction
  ajnaDepositBorrow: AjnaDepositBorrowAction
} = {
  ajnaPaybackWithdraw,
  ajnaDepositBorrow,
}

const actions = { aave, ajna, common, maker }

export { actions }
