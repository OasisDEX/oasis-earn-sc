import { ajnaAdjustDownOperationDefinition } from '@deploy-configurations/operation-definitions'
import { FEE_BASE, MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
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

type AjnaAdjustRiskDownArgs = WithCollateralAndWithdrawal &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAjnaStrategyAddresses &
  WithAjnaBucketPrice

export type AjnaAdjustRiskDownOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
}: AjnaAdjustRiskDownArgs) => Promise<IOperation>

export const adjustRiskDown: AjnaAdjustRiskDownOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
}) => {
  // Simulation is based on worst case swap IE Max slippage
  // Payback Debt using FL which should be equivalent to minSwapToAmount
  // Withdraw Collateral according to simulation
  // Swap Collateral to Debt (should get more than minSwapToAmount)
  // Payback Debt using FL (should be equivalent to/gt minSwapToAmount)
  // Withdraw remaining dust debt
  // Resulting risk will be same as simulation given that dust amount is transferred to user
  const setDebtTokenApprovalOnPool = actions.common.setApproval({
    asset: debt.address,
    delegate: addresses.pool,
    amount: flashloan.amount,
    sumAmounts: false,
  })

  const paybackWithdraw = actions.ajna.ajnaPaybackWithdraw(
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

  const returnCollateralFunds = actions.common.returnFunds({
    asset: collateral.isEth ? addresses.ETH : collateral.address,
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
    calls: [takeAFlashLoan, returnDebtFunds, returnCollateralFunds],
    operationName: ajnaAdjustDownOperationDefinition.name,
  }
}
