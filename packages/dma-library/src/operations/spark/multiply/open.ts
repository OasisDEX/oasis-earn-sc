import { getSparkOpenOperationDefinition } from '@deploy-configurations/operation-definitions'
import { NULL_ADDRESS, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  Protocol,
  WithCollateral,
  WithDebtAndBorrow,
  WithEMode,
  WithFlashloan,
  WithNetwork,
  WithOptionalDeposit,
  WithPosition,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { WithAaveLikeStrategyAddresses } from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type OpenOperationArgs = WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPosition &
  WithEMode &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type SparkOpenOperation = ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  emode,
  addresses,
  network,
}: OpenOperationArgs) => Promise<IOperation>

export const open: SparkOpenOperation = async ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  emode,
  addresses,
  network,
}) => {
  const depositAmount = deposit?.amount || ZERO
  const depositAddress = deposit?.address || NULL_ADDRESS

  if (depositAddress !== collateral.address) {
    throw new Error('Deposit token must be the same as collateral token')
  }

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
  wrapEth.skipped = !debt.isEth && !collateral.isEth

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

  const setCollateralApproval = actions.common.setApproval(
    network,
    {
      amount: depositAmount,
      asset: flashloan.token.address,
      delegate: addresses.lendingPool,
      sumAmounts: true,
    },
    [0, 0, swapActionStorageIndex, 0],
  )

  const depositCollateral = actions.spark.deposit(
    network,
    {
      amount: depositAmount,
      asset: collateral.address,
      sumAmounts: true,
    },
    [0, swapActionStorageIndex, 0, 0],
  )

  const borrowDebtTokens = actions.spark.borrow(network, {
    amount: debt.borrow.amount,
    asset: debt.address,
    to: addresses.operationExecutor,
  })

  const protocol: Protocol = 'Spark'

  const positionCreated = actions.common.positionCreated(network, {
    protocol,
    positionType: position.type,
    collateralToken: collateral.address,
    debtToken: debt.address,
  })

  const setEModeOnCollateral = actions.spark.setEMode(network, {
    categoryId: emode.categoryId || 0,
  })

  setEModeOnCollateral.skipped = !emode.categoryId || emode.categoryId === 0

  const flashloanCalls = [
    pullCollateralTokensToProxy,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralApproval,
    depositCollateral,
    borrowDebtTokens,
    setEModeOnCollateral,
    positionCreated,
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
    operationName: getSparkOpenOperationDefinition(network).name,
  }
}
