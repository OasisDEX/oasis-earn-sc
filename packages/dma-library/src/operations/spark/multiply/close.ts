import { getSparkCloseOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { FEE_BASE, MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  IOperation,
  WithCollateral,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { WithAaveLikeStrategyAddresses } from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

export type CloseArgs = WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPositionAndLockedCollateral &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type SparkCloseOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  network,
}: CloseArgs) => Promise<IOperation>

export const close: SparkCloseOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  network,
}) => {
  const setEModeOnCollateral = actions.spark.setEMode(network, {
    categoryId: 0,
  })
  const setDebtTokenApprovalOnPool = actions.common.setApproval(Network.MAINNET, {
    asset: debt.address,
    delegate: addresses.lendingPool,
    amount: flashloan.token.amount,
    sumAmounts: false,
  })

  const paybackDebt = actions.spark.payback(network, {
    asset: debt.address,
    amount: ZERO,
    paybackAll: true,
  })

  const withdrawCollateral = actions.spark.withdraw(network, {
    asset: collateral.address,
    amount: new BigNumber(MAX_UINT),
    to: proxy.address,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const sendQuoteTokenToOpExecutor = actions.common.sendToken(Network.MAINNET, {
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: flashloan.token.amount.plus(BALANCER_FEE.div(FEE_BASE).times(flashloan.token.amount)),
  })

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: debt.isEth ? addresses.tokens.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: collateral.isEth ? addresses.tokens.ETH : collateral.address,
  })

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: flashloan.token.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: [
      setEModeOnCollateral,
      setDebtTokenApprovalOnPool,
      paybackDebt,
      withdrawCollateral,
      swapCollateralTokensForDebtTokens,
      sendQuoteTokenToOpExecutor,
      unwrapEth,
    ],
  })

  return {
    calls: [takeAFlashLoan, returnDebtFunds, returnCollateralFunds],
    operationName: getSparkCloseOperationDefinition(network).name,
  }
}
