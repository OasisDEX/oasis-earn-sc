import { ajnaAdjustUpOperationDefinition } from '@deploy-configurations/operation-definitions'
import { ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithCollateral,
  WithDebtAndBorrow,
  WithFlashloan,
  WithNetwork,
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
  WithAjnaBucketPrice &
  WithNetwork

export type AjnaAdjustRiskUpOperation = ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
  network,
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
  network,
}) => {
  const depositAmount = deposit?.amount || ZERO

  const pullCollateralTokensToProxy = actions.common.pullToken(network, {
    asset: collateral.address,
    amount: depositAmount,
    from: proxy.owner,
  })

  const wrapEth = actions.common.wrapEth(network, {
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const hasAmountToDeposit = depositAmount.gt(ZERO)
  pullCollateralTokensToProxy.skipped = !hasAmountToDeposit || collateral.isEth
  const shouldSkippWrapEth = !collateral.isEth
  wrapEth.skipped = shouldSkippWrapEth

  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
    fromAsset: debt.address,
    toAsset: collateral.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const swapValueIndex = shouldSkippWrapEth ? 1 : 2

  const setCollateralTokenApprovalOnPool = actions.common.setApproval(
    network,
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

  const flashloanCalls = [
    pullCollateralTokensToProxy,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnPool,
    depositBorrow,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
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
