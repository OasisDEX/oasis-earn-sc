import { getMorphoBluePaybackWithdrawOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { IOperation, MorphoBlueMarket } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { MorphoBlueStrategyAddresses } from '../addresses'

type MorphoBluePaybackWithdrawArgs = {
  morphoBlueMarket: MorphoBlueMarket

  amountCollateralToWithdrawInBaseUnit: BigNumber
  amountDebtToPaybackInBaseUnit: BigNumber
  isPaybackAll: boolean

  proxy: string
  user: string
  addresses: MorphoBlueStrategyAddresses
  network: Network
}

export type MorphoBluePaybackWithdrawOperation = (
  args: MorphoBluePaybackWithdrawArgs,
) => Promise<IOperation>

export const paybackWithdraw: MorphoBluePaybackWithdrawOperation = async args => {
  const { network } = args
  const debtTokenIsEth = args.morphoBlueMarket.loanToken === args.addresses.tokens.ETH
  const collateralTokenIsEth = args.morphoBlueMarket.collateralToken === args.addresses.tokens.ETH

  const pullDebtTokensToProxy = actions.common.pullToken(network, {
    asset: args.morphoBlueMarket.loanToken,
    amount: args.amountDebtToPaybackInBaseUnit,
    from: args.user,
  })
  const setDebtApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: args.amountDebtToPaybackInBaseUnit,
    asset: args.morphoBlueMarket.loanToken,
    delegate: args.addresses.morphoblue,
    sumAmounts: false,
  })
  const wrapEth = actions.common.wrapEth(network, {
    amount: args.amountDebtToPaybackInBaseUnit,
  })
  const paybackDebt = actions.morphoblue.payback(args.network, {
    morphoBlueMarket: args.morphoBlueMarket,
    amount: args.amountDebtToPaybackInBaseUnit,
    paybackAll: args.isPaybackAll,
  })
  const unwrapEthDebt = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })
  const returnLeftFundFromPayback = actions.common.returnFunds(network, {
    asset: debtTokenIsEth ? args.addresses.tokens.ETH : args.morphoBlueMarket.loanToken,
  })

  const withdrawCollateralFromAAVE = actions.morphoblue.withdraw(args.network, {
    morphoBlueMarket: args.morphoBlueMarket,
    amount: args.amountCollateralToWithdrawInBaseUnit,
    to: args.proxy,
  })
  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  const returnFunds = actions.common.returnFunds(network, {
    asset: collateralTokenIsEth ? args.addresses.tokens.ETH : args.morphoBlueMarket.collateralToken,
  })

  pullDebtTokensToProxy.skipped =
    args.amountDebtToPaybackInBaseUnit.lte(ZERO) ||
    args.morphoBlueMarket.loanToken === args.addresses.tokens.ETH
  setDebtApprovalOnLendingPool.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)
  wrapEth.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO) || !debtTokenIsEth
  paybackDebt.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)
  unwrapEthDebt.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO) || !debtTokenIsEth
  returnLeftFundFromPayback.skipped = args.amountDebtToPaybackInBaseUnit.lte(ZERO)

  withdrawCollateralFromAAVE.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO)
  unwrapEth.skipped = args.amountCollateralToWithdrawInBaseUnit.lte(ZERO) || !collateralTokenIsEth
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
    operationName: getMorphoBluePaybackWithdrawOperationDefinition(args.network).name,
  }
}
