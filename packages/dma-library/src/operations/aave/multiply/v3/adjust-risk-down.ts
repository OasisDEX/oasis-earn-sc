import { getAaveAdjustDownV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { actions } from '@dma-library/actions'
import { IOperation } from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithProxy,
  WithSwap,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

export type AdjustRiskDownArgs = WithCollateralAndWithdrawal &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type AaveV3AdjustDownOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}: AdjustRiskDownArgs) => Promise<IOperation>

export const adjustRiskDown: AaveV3AdjustDownOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}) => {
  const setFlashloanTokenApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositFlashloanTokenInAave = actions.aave.v3.aaveV3Deposit(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v3.aaveV3Withdraw(network, {
    asset: collateral.address,
    amount: collateral.withdrawal.amount,
    to: proxy.address,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    network,
    {
      amount: 0,
      asset: debt.address,
      delegate: addresses.lendingPool,
      sumAmounts: false,
    },
    [0, 0, 4, 0],
  )

  const paybackInAAVE = actions.aave.v3.aaveV3Payback(
    network,
    {
      asset: debt.address,
      amount: new BigNumber(0),
      paybackAll: false,
    },
    [0, 4, 0],
  )

  const withdrawFlashloanTokenFromAave = actions.aave.v3.aaveV3WithdrawAuto(
    network,
    {
      asset: flashloan.token.address,
      amount: flashloan.token.amount,
      to: addresses.operationExecutor,
    },
    [1],
  )
  //
  // const unwrapEth = actions.common.unwrapEth(network, {
  //   amount: new BigNumber(MAX_UINT),
  // })

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: collateral.address,
  })

  // unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const flashloanCalls = [
    setFlashloanTokenApprovalOnLendingPool,
    depositFlashloanTokenInAave,
    withdrawCollateralFromAAVE,
    swapCollateralTokensForDebtTokens,
    setDebtTokenApprovalOnLendingPool,
    paybackInAAVE,
    withdrawFlashloanTokenFromAave,
    // unwrapEth,
    returnDebtFunds,
    returnCollateralFunds,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoanBalancer(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: flashloan.token.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: getAaveAdjustDownV3OperationDefinition(network).name,
  }
}
