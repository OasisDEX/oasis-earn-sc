import { getAaveAdjustUpV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { NULL_ADDRESS, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { IOperation } from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import {
  WithAaveV2StrategyAddresses,
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

type AdjustRiskUpArgs = WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAaveV2StrategyAddresses &
  WithNetwork

export type AaveV2AdjustUpOperation = ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}: AdjustRiskUpArgs) => Promise<IOperation>

export const adjustRiskUp: AaveV2AdjustUpOperation = async ({
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

  const isDepositingCollateral = deposit?.address === collateral.address
  const isDepositingDebtTokens = deposit?.address === debt.address
  const pullDebtTokensToProxy = actions.common.pullToken(network, {
    asset: debt.address,
    amount: isDepositingDebtTokens ? depositAmount : ZERO,
    from: proxy.owner,
  })

  const pullCollateralTokensToProxy = actions.common.pullToken(network, {
    asset: collateral.address,
    amount: isDepositingCollateral ? depositAmount : ZERO,
    from: proxy.owner,
  })

  const setDaiApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: flashloan.amount,
    asset: addresses.DAI,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v2.aaveDeposit(network, {
    amount: flashloan.amount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const borrowDebtTokensFromAAVE = actions.aave.v2.aaveBorrow(network, {
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

  const depositCollateral = actions.aave.v2.aaveDeposit(
    network,
    {
      asset: collateral.address,
      amount: depositIsCollateral ? depositAmount : ZERO,
      sumAmounts: true,
      setAsCollateral: true,
    },
    [0, 3, 0, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw(network, {
    asset: addresses.DAI,
    amount: flashloan.amount,
    to: addresses.operationExecutor,
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
    depositDaiInAAVE,
    borrowDebtTokensFromAAVE,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnLendingPool,
    depositCollateral,
    withdrawDAIFromAAVE,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: addresses.DAI,
    flashloanAmount: flashloan.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.DssFlash,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: getAaveAdjustUpV2OperationDefinition(network).name,
  }
}
