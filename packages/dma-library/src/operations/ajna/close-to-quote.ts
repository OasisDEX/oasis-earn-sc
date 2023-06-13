import { getAjnaCloseToQuoteOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithFlashloan,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'

type AjnaCloseArgs = WithCollateralAndWithdrawal &
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
  const setDebtTokenApprovalOnPool = actions.common.setApproval(Network.MAINNET, {
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

  const swapCollateralTokensForDebtTokens = actions.common.swap(Network.MAINNET, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const unwrapEth = actions.common.unwrapEth(Network.MAINNET, {
    amount: new BigNumber(MAX_UINT),
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const returnDebtFunds = actions.common.returnFunds(Network.MAINNET, {
    asset: debt.isEth ? addresses.ETH : debt.address,
  })

  const flashloanCalls = [
    setDebtTokenApprovalOnPool,
    paybackWithdraw,
    swapCollateralTokensForDebtTokens,
    unwrapEth,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(Network.MAINNET, {
    isDPMProxy: proxy.isDPMProxy,
    asset: debt.address,
    flashloanAmount: flashloan.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.Balancer,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan, returnDebtFunds],
    operationName: getAjnaCloseToQuoteOperationDefinition(Network.MAINNET).name,
  }
}
