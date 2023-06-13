import { ajnaCloseToQuoteOperationDefinition } from '@deploy-configurations/operation-definitions'
import { FEE_BASE, MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  IOperation,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithCollateral,
  WithDebt,
  WithFlashloan,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'

type AjnaCloseArgs = WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAjnaStrategyAddresses &
  WithAjnaBucketPrice

export type AjnaCloseToQuoteOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
}: AjnaCloseArgs) => Promise<IOperation>

export const closeToQuote: AjnaCloseToQuoteOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
}) => {
  const setDebtTokenApprovalOnPool = actions.common.setApproval({
    asset: debt.address,
    delegate: addresses.pool,
    amount: flashloan.amount,
    sumAmounts: false,
  })

  const paybackWithdraw = actions.ajna.ajnaPaybackWithdraw({
    quoteToken: debt.address,
    collateralToken: collateral.address,
    withdrawAmount: ZERO,
    paybackAmount: ZERO,
    withdrawAll: true,
    paybackAll: true,
    price,
  })

  console.log('SWAP')
  console.log(swap.amount.toString())
  console.log(swap.receiveAtLeast.toString())
  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const sendQuoteTokenToOpExecutor = actions.common.sendToken({
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: flashloan.amount.plus(BALANCER_FEE.div(FEE_BASE).times(flashloan.amount)),
  })

  const returnDebtFunds = actions.common.returnFunds({
    asset: debt.isEth ? addresses.ETH : debt.address,
  })

  const flashloanCalls = [
    setDebtTokenApprovalOnPool,
    paybackWithdraw,
    swapCollateralTokensForDebtTokens,
    unwrapEth,
    sendQuoteTokenToOpExecutor,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    isDPMProxy: proxy.isDPMProxy,
    asset: debt.address,
    flashloanAmount: flashloan.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.Balancer,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan, returnDebtFunds],
    operationName: ajnaCloseToQuoteOperationDefinition.name,
  }
}
