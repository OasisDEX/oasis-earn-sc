import * as actions from '@dma-library/actions'
import {
  IOperation,
  Protocol,
  WithAjnaStrategyAddresses,
  WithCollateral,
  WithDebtAndBorrow,
  WithFlashloan,
  WithOptionalDeposit,
  WithPosition,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { NULL_ADDRESS, ZERO } from '@oasisdex/dma-common/constants'
import { ajnaOpenOperationDefinition } from '@oasisdex/dma-deployments/operation-definitions'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

type OpenArgs = WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPosition &
  WithAjnaStrategyAddresses

// TODO we will need here price param as well
export async function open({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
}: OpenArgs): Promise<IOperation> {
  const depositAmount = deposit?.amount || ZERO
  const depositAddress = deposit?.address || NULL_ADDRESS

  const isDepositingCollateral = deposit?.address === collateral.address
  const isDepositingDebtTokens = deposit?.address === debt.address

  const pullDebtTokensToProxy = actions.common.pullToken({
    asset: debt.address,
    amount: isDepositingDebtTokens ? depositAmount : ZERO,
    from: proxy.owner,
  })

  const pullCollateralTokensToProxy = actions.common.pullToken({
    asset: collateral.address,
    amount: isDepositingCollateral ? depositAmount : ZERO,
    from: proxy.owner,
  })

  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: flashloan.amount,
    asset: addresses.DAI,
    delegate: addresses.pool,
    sumAmounts: false,
  })

  const depositBorrow = actions.ajna.ajnaDepositBorrow({
    depositAmount: flashloan.amount,
    depositAsset: addresses.DAI,
    sumAmounts: false,
    borrowAsset: debt.address,
    borrowAmount: debt.borrow.amount,
    to: proxy.address,
    price: ZERO, // TODO we need to use correct value here
  })

  const wrapEth = actions.common.wrapEth({
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const swapDebtTokensForCollateralTokens = actions.common.swap({
    fromAsset: debt.address,
    toAsset: collateral.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const depositIsCollateral = depositAddress === collateral.address
  const setCollateralTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: collateral.address,
      delegate: addresses.pool,
      amount: depositIsCollateral ? depositAmount : ZERO,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositCollateral = actions.ajna.ajnaDepositBorrow(
    {
      depositAsset: addresses.DAI,
      depositAmount: flashloan.amount,
      sumAmounts: true,
      setAsCollateral: true,
      borrowAsset: debt.address,
      to: proxy.address,
      price: ZERO, // TODO we need to use correct value here
    },
    [0, 3, 0, 0, 0, 0, 0, 0], // TODO it's for sure off right now
  )

  const withdrawDai = actions.ajna.ajnaPaybackWithdraw({
    withdrawAmount: flashloan.amount,
    withdrawAsset: addresses.DAI,
    to: proxy.address,
  })

  const protocol: Protocol = 'Ajna'

  const positionCreated = actions.common.positionCreated({
    protocol,
    positionType: position.type,
    collateralToken: collateral.address,
    debtToken: debt.address,
  })

  const hasAmountToDeposit = depositAmount.gt(ZERO)
  pullDebtTokensToProxy.skipped = isDepositingCollateral || !hasAmountToDeposit || debt.isEth
  pullCollateralTokensToProxy.skipped =
    isDepositingDebtTokens || !hasAmountToDeposit || collateral.isEth
  wrapEth.skipped = !debt.isEth && !collateral.isEth

  const flashloanCalls = [
    pullDebtTokensToProxy,
    pullCollateralTokensToProxy,
    setDaiApprovalOnLendingPool,
    depositBorrow,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnLendingPool,
    depositCollateral,
    withdrawDai,
    positionCreated,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    isDPMProxy: proxy.isDPMProxy,
    asset: addresses.DAI,
    flashloanAmount: flashloan.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: ajnaOpenOperationDefinition.name,
  }
}
