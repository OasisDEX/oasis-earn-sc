import { MAX_UINT, OPERATION_NAMES } from '@dma-common/constants'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import { actions } from '@dma-library/actions'
import { IOperation } from '@dma-library/types'
import {
  WithAaveV3StrategyAddresses,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithFlashloan,
  WithProxy,
  WithSwap,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

type AdjustRiskDownArgs = WithCollateralAndWithdrawal &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAaveV3StrategyAddresses

export async function adjustRiskDown({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
}: AdjustRiskDownArgs): Promise<IOperation> {
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: flashloan.amount,
    asset: addresses.DAI,
    delegate: addresses.pool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v3.aaveV3Deposit({
    amount: flashloan.amount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v3.aaveV3Withdraw({
    asset: collateral.address,
    amount: collateral.withdrawal.amount,
    to: proxy.address,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      amount: 0,
      asset: debt.address,
      delegate: addresses.pool,
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v3.aaveV3Payback(
    {
      asset: debt.address,
      amount: new BigNumber(0),
      paybackAll: false,
    },
    [0, 3, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.v3.aaveV3Withdraw({
    asset: addresses.DAI,
    amount: flashloan.amount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  const returnDebtFunds = actions.common.returnFunds({
    asset: debt.isEth ? ADDRESSES[Network.MAINNET].common.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds({
    asset: collateral.isEth ? ADDRESSES[Network.MAINNET].common.ETH : collateral.address,
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const flashloanCalls = [
    setDaiApprovalOnLendingPool,
    depositDaiInAAVE,
    withdrawCollateralFromAAVE,
    swapCollateralTokensForDebtTokens,
    setDebtTokenApprovalOnLendingPool,
    paybackInAAVE,
    withdrawDAIFromAAVE,
    unwrapEth,
    returnDebtFunds,
    returnCollateralFunds,
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
    operationName: OPERATION_NAMES.aave.v3.ADJUST_RISK_DOWN,
  }
}
