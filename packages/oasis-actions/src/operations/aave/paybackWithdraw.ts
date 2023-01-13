import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { MAX_UINT, OPERATION_NAMES, ZERO } from '../../helpers/constants'
import { IOperation } from '../../strategies/types'
import { AAVEStrategyAddresses } from './addresses'

export async function paybackWithdraw(args: {
  amountCollateralToWithdrawInBaseUnit: BigNumber
  amountDebtToPaybackInBaseUnit: BigNumber
  collateralTokenAddress: string
  collateralIsEth: boolean
  debtTokenAddress: string
  debtTokenIsEth: boolean
  proxy: string
  user: string
  isDPMProxy: boolean
  addresses: AAVEStrategyAddresses
}): Promise<IOperation> {
  const pullDebtTokensToProxy = actions.common.pullToken({
    asset: args.debtTokenAddress,
    amount: args.amountDebtToPaybackInBaseUnit,
    from: args.user,
  })
  const setDebtApprovalOnLendingPool = actions.common.setApproval({
    amount: args.amountDebtToPaybackInBaseUnit,
    asset: args.debtTokenAddress,
    delegate: args.addresses.aaveLendingPool,
    sumAmounts: false,
  })
  const wrapEth = actions.common.wrapEth({
    amount: args.amountDebtToPaybackInBaseUnit,
  })
  const paybackDebt = actions.aave.aavePayback({
    asset: args.debtTokenAddress,
    amount: args.amountDebtToPaybackInBaseUnit,
    paybackAll: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.aaveWithdraw({
    asset: args.collateralTokenAddress,
    amount: args.amountCollateralToWithdrawInBaseUnit,
    to: args.proxy,
  })
  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  const sendTokenToUser = actions.common.sendToken({
    amount: new BigNumber(MAX_UINT),
    asset: args.collateralIsEth ? args.addresses.ETH : args.collateralTokenAddress,
    to: args.user,
  })
  const returnFunds = actions.common.returnFunds({
    asset: args.collateralIsEth ? args.addresses.ETH : args.collateralTokenAddress,
  })

  pullDebtTokensToProxy.skipped =
    args.amountDebtToPaybackInBaseUnit.lte(ZERO) || args.debtTokenIsEth
  setDebtApprovalOnLendingPool.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)
  paybackDebt.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)
  wrapEth.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO) || !args.debtTokenIsEth

  withdrawCollateralFromAAVE.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO)
  unwrapEth.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO) || !args.collateralIsEth
  sendTokenToUser.skipped = true // right now DPM has owner functionality, so it will work.
  returnFunds.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO)

  const calls = [
    pullDebtTokensToProxy,
    setDebtApprovalOnLendingPool,
    wrapEth,
    paybackDebt,
    withdrawCollateralFromAAVE,
    unwrapEth,
    sendTokenToUser,
    returnFunds,
  ]

  return { calls: calls, operationName: OPERATION_NAMES.aave.PAYBACK_WITHDRAW }
}
