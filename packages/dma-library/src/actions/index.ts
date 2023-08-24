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
import { sparkBorrow, sparkDeposit, sparkPayback, sparkSetEMode, sparkWithdraw } from './spark'

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

const ajna: {
  ajnaPaybackWithdraw: AjnaPaybackWithdrawAction
  ajnaDepositBorrow: AjnaDepositBorrowAction
} = {
  ajnaPaybackWithdraw,
  ajnaDepositBorrow,
}

const spark = {
  borrow: sparkBorrow,
  deposit: sparkDeposit,
  withdraw: sparkWithdraw,
  payback: sparkPayback,
  setEMode: sparkSetEMode,
}

const actions = { aave, ajna, common, spark }

export { actions }
