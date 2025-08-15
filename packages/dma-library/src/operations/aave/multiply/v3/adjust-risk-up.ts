import { getAaveAdjustUpV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { NULL_ADDRESS, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { IOperation } from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithCollateral,
  WithDebtAndBorrow,
  WithFlashloan,
  WithNetwork,
  WithOptionalDeposit,
  WithProxy,
  WithSwap,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type AdjustRiskUpArgs = WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type AaveV3AdjustUpOperation = ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}: AdjustRiskUpArgs) => Promise<IOperation>

export const adjustRiskUp: AaveV3AdjustUpOperation = async ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}) => {
  const depositAmount = deposit?.amount || ZERO
  const depositAddress = deposit?.address || NULL_ADDRESS

  const pullDepositTokensToProxy = actions.common.pullToken(network, {
    asset: depositAddress,
    amount: depositAmount,
    from: proxy.owner,
  })

  const setFlashLoanApproval = actions.common.setApproval(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositFlashloan = actions.aave.v3.aaveV3Deposit(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    sumAmounts: false,
  })

  const borrowDebtTokensFromAAVE = actions.aave.v3.aaveV3Borrow(network, {
    amount: debt.borrow.amount,
    asset: debt.address,
    to: proxy.address,
  })

  const wrapEth = actions.common.wrapEth(network, {
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
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
    network,
    {
      asset: collateral.address,
      delegate: addresses.lendingPool,
      amount: depositIsCollateral ? depositAmount : ZERO,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositCollateral = actions.aave.v3.aaveV3Deposit(
    network,
    {
      asset: collateral.address,
      amount: depositIsCollateral ? depositAmount : ZERO,
      sumAmounts: true,
      setAsCollateral: true,
    },
    [0, 3, 0, 0],
  )

  // Aave V3 changed how they round numbers in one of their contracts
  // They effect is that we can no longer immediately withdraw the full amount of the flashloan
  // This is a workaround to ensure we can repay the flashloan in full
  // https://github.com/aave-dao/aave-v3-origin/commit/070cd23d949d828ad78d098ef481c2049f5eabb6#diff-b7654541d4083b2f7a8e06e4359f5082eca09c6d890e7b5af914395e15fb04b5
  const withdrawFlashLoanAmount = flashloan.token.amount.minus(1)
  const withdrawFlashloan = actions.aave.v3.aaveV3Withdraw(network, {
    asset: flashloan.token.address,
    amount: withdrawFlashLoanAmount,
    to: addresses.operationExecutor,
  })

  pullDepositTokensToProxy.skipped = depositAmount.eq(ZERO) || debt.isEth
  wrapEth.skipped = !debt.isEth && !collateral.isEth

  const flashloanCalls = [
    pullDepositTokensToProxy,
    setFlashLoanApproval,
    depositFlashloan,
    borrowDebtTokensFromAAVE,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnLendingPool,
    depositCollateral,
    withdrawFlashloan,
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
    operationName: getAaveAdjustUpV3OperationDefinition(network).name,
  }
}
