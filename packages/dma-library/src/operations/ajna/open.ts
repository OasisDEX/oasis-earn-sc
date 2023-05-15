import { ajnaOpenOperationDefinition } from '@deploy-configurations/operation-definitions'
import { ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  Protocol,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithCollateral,
  WithDebtAndBorrow,
  WithFlashloan,
  WithOptionalDeposit,
  WithPosition,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

type OpenArgs = WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPosition &
  WithAjnaStrategyAddresses &
  WithAjnaBucketPrice

export type AjnaOpenOperation = ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  price,
}: OpenArgs) => Promise<IOperation>

export const open: AjnaOpenOperation = async ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
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
  const shouldSkippWrapEth = !collateral.isEth
  wrapEth.skipped = shouldSkippWrapEth

  const swapDebtTokensForCollateralTokens = actions.common.swap({
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
      pool: addresses.pool,
      depositAmount,
      borrowAmount: debt.borrow.amount,
      sumDepositAmounts: true,
      price,
    },
    [0, swapValueIndex, 0, 0, 0],
  )

  const protocol: Protocol = 'Ajna'

  const positionCreated = actions.common.positionCreated({
    protocol,
    positionType: position.type,
    collateralToken: collateral.address,
    debtToken: debt.address,
  })

  const flashloanCalls = [
    pullCollateralTokensToProxy,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnPool,
    depositBorrow,
    positionCreated,
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
    operationName: ajnaOpenOperationDefinition.name,
  }
}
