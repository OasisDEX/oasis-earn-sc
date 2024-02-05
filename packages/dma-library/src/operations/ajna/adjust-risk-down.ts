import { getAjnaAdjustDownOperationDefinition } from '@deploy-configurations/operation-definitions'
import { FEE_BASE, MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  IOperation,
  WithAjnaBucketPrice,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithProxy,
  WithSummerStrategyAddresses,
  WithSwap,
} from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'

type AjnaAdjustRiskDownArgs = WithCollateralAndWithdrawal &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithSummerStrategyAddresses &
  WithAjnaBucketPrice &
  WithNetwork

export type AjnaAdjustRiskDownOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
  network,
}: AjnaAdjustRiskDownArgs) => Promise<IOperation>

export const adjustRiskDown: AjnaAdjustRiskDownOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
  network,
}) => {
  // Simulation is based on worst case swap IE Max slippage
  // Payback Debt using FL which should be equivalent to minSwapToAmount
  // Withdraw Collateral according to simulation
  // Swap Collateral to Debt (should get more than minSwapToAmount)
  // Payback Debt using FL (should be equivalent to/gt minSwapToAmount)
  // Withdraw remaining dust debt
  // Resulting risk will be same as simulation given that dust amount is transferred to user
  const setDebtTokenApprovalOnPool = actions.common.setApproval(network, {
    asset: debt.address,
    delegate: addresses.pool,
    amount: flashloan.token.amount,
    sumAmounts: false,
  })

  const paybackWithdraw = actions.ajna.ajnaPaybackWithdraw(
    network,
    {
      quoteToken: debt.address,
      collateralToken: collateral.address,
      withdrawAmount: collateral.withdrawal.amount,
      // Payback the max amount we can get from the swap
      paybackAmount: swap.receiveAtLeast,
      price,
    },
    [0, 0, 0, 0, 0, 0, 0],
  )

  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const sendQuoteTokenToOpExecutor = actions.common.sendToken(network, {
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: flashloan.token.amount.plus(BALANCER_FEE.div(FEE_BASE).times(flashloan.token.amount)),
  })

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
    unwrapEth,
    sendQuoteTokenToOpExecutor,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: debt.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.Balancer,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan, returnDebtFunds, returnCollateralFunds],
    operationName: getAjnaAdjustDownOperationDefinition(network).name,
  }
}
