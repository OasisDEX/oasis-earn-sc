import { MAX_UINT, OPERATION_NAMES, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { IOperation } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { AAVEStrategyAddresses } from './addresses'

export async function paybackWithdraw(args: {
  amountCollateralToWithdrawInBaseUnit: BigNumber
  amountDebtToPaybackInBaseUnit: BigNumber
  isPaybackAll: boolean
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
    delegate: args.addresses.lendingPool,
    sumAmounts: false,
  })
  const wrapEth = actions.common.wrapEth({
    amount: args.amountDebtToPaybackInBaseUnit,
  })
  const paybackDebt = actions.aave.v2.aavePayback({
    asset: args.debtTokenAddress,
    amount: args.amountDebtToPaybackInBaseUnit,
    paybackAll: args.isPaybackAll,
  })
  const unwrapEthDebt = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })
  const returnLeftFundFromPayback = actions.common.returnFunds({
    asset: args.debtTokenIsEth ? args.addresses.ETH : args.debtTokenAddress,
  })

  const withdrawCollateralFromAAVE = actions.aave.v2.aaveWithdraw({
    asset: args.collateralTokenAddress,
    amount: args.amountCollateralToWithdrawInBaseUnit,
    to: args.proxy,
  })
  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  const returnFunds = actions.common.returnFunds({
    asset: args.collateralIsEth ? args.addresses.ETH : args.collateralTokenAddress,
  })

  pullDebtTokensToProxy.skipped =
    args.amountDebtToPaybackInBaseUnit.lte(ZERO) || args.debtTokenIsEth
  setDebtApprovalOnLendingPool.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)
  wrapEth.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO) || !args.debtTokenIsEth
  paybackDebt.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)
  unwrapEthDebt.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO) || !args.debtTokenIsEth
  returnLeftFundFromPayback.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)

  withdrawCollateralFromAAVE.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO)
  unwrapEth.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO) || !args.collateralIsEth
  returnFunds.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO)

  const calls = [
    pullDebtTokensToProxy,
    setDebtApprovalOnLendingPool,
    wrapEth,
    paybackDebt,
    unwrapEthDebt,
    returnLeftFundFromPayback,
    withdrawCollateralFromAAVE,
    unwrapEth,
    returnFunds,
  ]

  return { calls: calls, operationName: OPERATION_NAMES.aave.v2.PAYBACK_WITHDRAW }
}
