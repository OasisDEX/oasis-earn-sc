import { aaveBorrow, aaveDeposit, aavePayback, aaveWithdraw } from './v2'
import { aaveV3Borrow, aaveV3Deposit, aaveV3Payback, aaveV3SetEMode, aaveV3Withdraw } from './v3'

const v2 = {
  aaveBorrow,
  aaveDeposit,
  aavePayback,
  aaveWithdraw,
}

const v3 = {
  aaveV3Borrow,
  aaveV3Deposit,
  aaveV3Payback,
  aaveV3Withdraw,
  aaveV3SetEMode,
}

export { v2, v3 }
