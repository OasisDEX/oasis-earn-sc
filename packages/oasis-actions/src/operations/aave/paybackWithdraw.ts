import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { ADDRESSES } from '../../helpers/addresses'
import { MAX_UINT, OPERATION_NAMES } from '../../helpers/constants'
import { IOperation } from '../../strategies/types/IOperation'

export async function paybackWithdraw(args: {
  amountCollateralToWithdrawInWei: BigNumber
  amountDebtToPaybackInWei: BigNumber
  collateralTokenAddress: string
  collateralIsEth: boolean
  debtTokenAddress: string
  debtTokenIsEth: boolean
  proxy: string
}): Promise<IOperation> {
  const paybackDebt = actions.aave.aavePayback({
    asset: args.debtTokenAddress,
    amount: args.amountDebtToPaybackInWei,
    paybackAll: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.aaveWithdraw({
    asset: args.collateralTokenAddress,
    amount: args.amountCollateralToWithdrawInWei,
    to: args.proxy,
  })

  const returnCollateralFunds = actions.common.returnFunds({
    asset: args.collateralIsEth ? ADDRESSES.main.ETH : args.collateralTokenAddress,
  })

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  unwrapEth.skipped = !args.collateralIsEth

  const calls = []
  if (args.amountDebtToPaybackInWei.gt(0)) {
    calls.push(paybackDebt)
  }
  if (args.amountCollateralToWithdrawInWei.gt(0)) {
    calls.push(withdrawCollateralFromAAVE)
    calls.push(unwrapEth)
    calls.push(returnCollateralFunds)
  }

  return { calls: calls, operationName: OPERATION_NAMES.common.CUSTOM_OPERATION }
}
