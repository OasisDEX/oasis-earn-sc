import { ajnaAdjustUpOperationDefinition } from '@deploy-configurations/operation-definitions'
import { FEE_BASE, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  IOperation,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithCollateral,
  WithDebtAndBorrow,
  WithFlashloan,
  WithOptionalDeposit,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

type AjnaAdjustRiskUpArgs = WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAjnaStrategyAddresses &
  WithAjnaBucketPrice

export type AjnaAdjustRiskUpOperation = ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
}: AjnaAdjustRiskUpArgs) => Promise<IOperation>

export const adjustRiskUp: AjnaAdjustRiskUpOperation = async ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
}) => {
  const depositAmount = deposit?.amount || ZERO

  const pullCollateralTokensToProxy = actions.common.pullToken({
    asset: collateral.address,
    amount: depositAmount,
    from: proxy.owner,
  })

  const wrapEth = actions.common.wrapEth({
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const hasAmountToDeposit = depositAmount.gt(ZERO)
  pullCollateralTokensToProxy.skipped = !hasAmountToDeposit || collateral.isEth
  const shouldSkipWrapEth = !collateral.isEth
  wrapEth.skipped = shouldSkipWrapEth

  const swapDebtTokensForCollateralTokens = actions.common.swap({
    fromAsset: debt.address,
    toAsset: collateral.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const swapValueIndex = shouldSkipWrapEth ? 1 : 2

  const setCollateralTokenApprovalOnPool = actions.common.setApproval(
    {
      asset: collateral.address,
      delegate: addresses.pool,
      amount: depositAmount,
      sumAmounts: true,
    },
    [0, 0, swapValueIndex, 0],
  )

  const depositBorrow = actions.ajna.ajnaDepositBorrow(
    {
      quoteToken: debt.address,
      collateralToken: collateral.address,
      depositAmount,
      borrowAmount: debt.borrow.amount,
      sumDepositAmounts: true,
      price,
    },
    [0, 0, swapValueIndex, 0, 0, 0],
  )

  const sendQuoteTokenToOpExecutor = actions.common.sendToken({
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: flashloan.amount.plus(BALANCER_FEE.div(FEE_BASE).times(flashloan.amount)),
  })

  const flashloanCalls = [
    pullCollateralTokensToProxy,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnPool,
    depositBorrow,
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
    calls: [takeAFlashLoan],
    operationName: ajnaAdjustUpOperationDefinition.name,
  }
}
