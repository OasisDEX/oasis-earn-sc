import { MAX_UINT, ZERO } from '@dma-common/constants'
import { aavePaybackWithdrawV3OperationDefinition } from '@dma-deployments/operation-definitions'
import { actions } from '@dma-library/actions'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3/addresses'
import { IOperation } from '@dma-library/types'
import BigNumber from 'bignumber.js'

type PaybackWithdrawArgs = {
  amountCollateralToWithdrawInBaseUnit: BigNumber
  amountDebtToPaybackInBaseUnit: BigNumber
  isPaybackAll: boolean
  collateralTokenAddress: string
  collateralIsEth: boolean
  debtTokenAddress: string
  debtTokenIsEth: boolean
  proxy: string
  user: string
  addresses: AAVEV3StrategyAddresses
}

export type AaveV3PaybackWithdrawOperation = (args: PaybackWithdrawArgs) => Promise<IOperation>

export const paybackWithdraw: AaveV3PaybackWithdrawOperation = async args => {
  const pullDebtTokensToProxy = actions.common.pullToken({
    asset: args.debtTokenAddress,
    amount: args.amountDebtToPaybackInBaseUnit,
    from: args.user,
  })
  const setDebtApprovalOnLendingPool = actions.common.setApproval({
    amount: args.amountDebtToPaybackInBaseUnit,
    asset: args.debtTokenAddress,
    delegate: args.addresses.pool,
    sumAmounts: false,
  })
  const wrapEth = actions.common.wrapEth({
    amount: args.amountDebtToPaybackInBaseUnit,
  })
  const paybackDebt = actions.aave.v3.aaveV3Payback({
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

  const withdrawCollateralFromAAVE = actions.aave.v3.aaveV3Withdraw({
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

  return { calls: calls, operationName: aavePaybackWithdrawV3OperationDefinition.name }
}
