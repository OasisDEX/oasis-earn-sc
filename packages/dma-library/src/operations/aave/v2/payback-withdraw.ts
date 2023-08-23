import { getAavePaybackWithdrawV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
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
  addresses: AaveLikeStrategyAddresses
  network: Network
}

export type AaveV2PaybackWithdrawOperation = (args: PaybackWithdrawArgs) => Promise<IOperation>

export const paybackWithdraw: AaveV2PaybackWithdrawOperation = async args => {
  const { network } = args
  const pullDebtTokensToProxy = actions.common.pullToken(network, {
    asset: args.debtTokenAddress,
    amount: args.amountDebtToPaybackInBaseUnit,
    from: args.user,
  })
  const setDebtApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: args.amountDebtToPaybackInBaseUnit,
    asset: args.debtTokenAddress,
    delegate: args.addresses.lendingPool,
    sumAmounts: false,
  })
  // TODO: this is not needed if the debt token is ETH
  // Left in for now to avoid redeploying operation
  const wrapEth = actions.common.wrapEth(network, {
    amount: args.amountDebtToPaybackInBaseUnit,
  })
  const paybackDebt = actions.aave.v2.aavePayback(network, {
    asset: args.debtTokenAddress,
    amount: args.isPaybackAll ? ZERO : args.amountDebtToPaybackInBaseUnit,
    paybackAll: args.isPaybackAll,
  })
  const unwrapEthDebt = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })
  if (!args.addresses.tokens.ETH) {
    throw new Error('Missing ETH address')
  }
  const returnLeftFundFromPayback = actions.common.returnFunds(network, {
    asset: args.debtTokenIsEth ? args.addresses.tokens.ETH : args.debtTokenAddress,
  })

  const withdrawCollateralFromAAVE = actions.aave.v2.aaveWithdraw(network, {
    asset: args.collateralTokenAddress,
    amount: args.amountCollateralToWithdrawInBaseUnit,
    to: args.proxy,
  })
  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  const returnFunds = actions.common.returnFunds(network, {
    asset: args.collateralIsEth ? args.addresses.tokens.ETH : args.collateralTokenAddress,
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

  return {
    calls: calls,
    operationName: getAavePaybackWithdrawV2OperationDefinition(args.network).name,
  }
}
