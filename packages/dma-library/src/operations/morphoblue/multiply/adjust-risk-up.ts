import { getMorphoBlueAdjustUpOperationDefinition } from '@deploy-configurations/operation-definitions'
import { ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { IOperation } from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithCollateral,
  WithDebtAndBorrow,
  WithFlashloan,
  WithMorphoBlueMarket,
  WithNetwork,
  WithOptionalDeposit,
  WithProxy,
  WithSwap,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type MorphoBlueAdjustRiskUpArgs = WithMorphoBlueMarket &
  WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type MorphoBlueAdjustUpOperation = ({
  morphoBlueMarket,
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}: MorphoBlueAdjustRiskUpArgs) => Promise<IOperation>

export const adjustRiskUp: MorphoBlueAdjustUpOperation = async ({
  morphoBlueMarket,
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}) => {
  if (collateral.address !== morphoBlueMarket.collateralToken) {
    throw new Error('Collateral token must be the same as MorphoBlue market collateral token')
  }
  if (debt.address !== morphoBlueMarket.loanToken) {
    throw new Error('Debt token must be the same as MorphoBlue market debt token')
  }

  const depositAmount = deposit?.amount || ZERO

  const pullCollateralTokensToProxy = actions.common.pullToken(network, {
    asset: collateral.address,
    amount: depositAmount,
    from: proxy.owner,
  })
  const hasAmountToDeposit = depositAmount.gt(ZERO)
  const shouldSkipPullCollateralTokensToProxy = !hasAmountToDeposit || collateral.isEth
  pullCollateralTokensToProxy.skipped = shouldSkipPullCollateralTokensToProxy

  const wrapEth = actions.common.wrapEth(network, {
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })
  wrapEth.skipped = !collateral.isEth

  // No previous actions store values with OpStorage
  const swapActionStorageIndex = 1
  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
    fromAsset: debt.address,
    toAsset: collateral.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setCollateralTokenApprovalOnLendingPool = actions.common.setApproval(
    network,
    {
      asset: collateral.address,
      delegate: addresses.lendingPool,
      amount: depositAmount,
      sumAmounts: true,
    },
    [0, 0, swapActionStorageIndex, 0],
  )

  const depositCollateral = actions.morphoblue.deposit(
    network,
    {
      morphoBlueMarket: morphoBlueMarket,
      amount: depositAmount,
      sumAmounts: true,
    },
    [swapActionStorageIndex, 0],
  )

  const borrowDebtToRepayFL = actions.morphoblue.borrow(network, {
    morphoBlueMarket: morphoBlueMarket,
    amount: debt.borrow.amount,
  })

  const sendQuoteTokenToOpExecutor = actions.common.sendToken(network, {
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: debt.borrow.amount,
  })

  const flashloanCalls = [
    pullCollateralTokensToProxy,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnLendingPool,
    depositCollateral,
    borrowDebtToRepayFL,
    sendQuoteTokenToOpExecutor,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: flashloan.token.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: getMorphoBlueAdjustUpOperationDefinition(network).name,
  }
}
