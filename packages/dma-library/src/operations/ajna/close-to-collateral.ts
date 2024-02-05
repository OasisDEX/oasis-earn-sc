import { getAjnaCloseToCollateralOperationDefinition } from '@deploy-configurations/operation-definitions'
import { FEE_BASE, MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  IOperation,
  WithAjnaBucketPrice,
  WithCollateral,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithProxy,
  WithSummerStrategyAddresses,
  WithSwap,
} from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'

type AjnaCloseArgs = WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithSummerStrategyAddresses &
  WithAjnaBucketPrice &
  WithNetwork

export type AjnaCloseToCollateralOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
  network,
}: AjnaCloseArgs) => Promise<IOperation>

export const closeToCollateral: AjnaCloseToCollateralOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
  network,
}) => {
  const setDebtTokenApprovalOnPool = actions.common.setApproval(network, {
    asset: debt.address,
    delegate: addresses.pool,
    amount: flashloan.token.amount,
    sumAmounts: false,
  })

  const paybackWithdraw = actions.ajna.ajnaPaybackWithdraw(network, {
    quoteToken: debt.address,
    collateralToken: collateral.address,
    withdrawAmount: ZERO,
    paybackAmount: ZERO,
    withdrawAll: true,
    paybackAll: true,
    price,
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

  const sendQuoteTokenToOpExecutor = actions.common.sendToken(network, {
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: flashloan.token.amount.plus(BALANCER_FEE.div(FEE_BASE).times(flashloan.token.amount)),
  })

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: debt.isEth ? addresses.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: collateral.isEth ? addresses.ETH : collateral.address,
  })

  const flashloanCalls = [
    setDebtTokenApprovalOnPool,
    paybackWithdraw,
    swapCollateralTokensForDebtTokens,
    sendQuoteTokenToOpExecutor,
    unwrapEth,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: flashloan.token.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.Balancer,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan, returnDebtFunds, returnCollateralFunds],
    operationName: getAjnaCloseToCollateralOperationDefinition(network).name,
  }
}
