import { getMorphoBluePaybackWithdrawOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { IOperation, MorphoBlueMarket } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { MorphoBlueStrategyAddresses } from '../addresses'

export type MorphoBluePaybackWithdrawArgs = {
  morphoBlueMarket: MorphoBlueMarket
  amountCollateralToWithdrawInBaseUnit: BigNumber
  amountDebtToPaybackInBaseUnit: BigNumber
  proxy: string
  user: string
}

export type MorphoBluePaybackWithdrawOperation = (
  args: MorphoBluePaybackWithdrawArgs,
  addresses: MorphoBlueStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const paybackWithdraw: MorphoBluePaybackWithdrawOperation = async (
  args,
  addresses,
  network,
) => {
  const debtTokenIsEth = args.morphoBlueMarket.loanToken === addresses.tokens.ETH
  const collateralTokenIsEth = args.morphoBlueMarket.collateralToken === addresses.tokens.ETH

  const pullDebtTokensToProxy = actions.common.pullToken(network, {
    asset: args.morphoBlueMarket.loanToken,
    amount: args.amountDebtToPaybackInBaseUnit,
    from: args.user,
  })
  const setDebtApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: args.amountDebtToPaybackInBaseUnit,
    asset: args.morphoBlueMarket.loanToken,
    delegate: addresses.morphoblue,
    sumAmounts: false,
  })
  const wrapEth = actions.common.wrapEth(network, {
    amount: args.amountDebtToPaybackInBaseUnit,
  })
  const paybackDebt = actions.morphoblue.payback(network, {
    morphoBlueMarket: args.morphoBlueMarket,
    amount: args.amountDebtToPaybackInBaseUnit,
  })
  const unwrapEthDebt = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })
  const returnLeftFundFromPayback = actions.common.returnFunds(network, {
    asset: debtTokenIsEth ? addresses.tokens.ETH : args.morphoBlueMarket.loanToken,
  })

  const withdrawCollateral = actions.morphoblue.withdraw(network, {
    morphoBlueMarket: args.morphoBlueMarket,
    amount: args.amountCollateralToWithdrawInBaseUnit,
    to: args.proxy,
  })
  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  const returnFunds = actions.common.returnFunds(network, {
    asset: collateralTokenIsEth ? addresses.tokens.ETH : args.morphoBlueMarket.collateralToken,
  })

  pullDebtTokensToProxy.skipped =
    args.amountDebtToPaybackInBaseUnit.lte(ZERO) ||
    args.morphoBlueMarket.loanToken === addresses.tokens.ETH
  setDebtApprovalOnLendingPool.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)
  wrapEth.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO) || !debtTokenIsEth
  paybackDebt.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)
  unwrapEthDebt.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO) || !debtTokenIsEth
  returnLeftFundFromPayback.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)

  withdrawCollateral.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO)
  unwrapEth.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO) || !collateralTokenIsEth
  returnFunds.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO)

  const calls = [
    pullDebtTokensToProxy,
    setDebtApprovalOnLendingPool,
    wrapEth,
    paybackDebt,
    unwrapEthDebt,
    returnLeftFundFromPayback,
    withdrawCollateral,
    unwrapEth,
    returnFunds,
  ]

  return {
    calls: calls,
    operationName: getMorphoBluePaybackWithdrawOperationDefinition(network).name,
  }
}
