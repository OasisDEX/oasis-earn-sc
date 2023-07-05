import { getAaveAdjustDownV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { actions } from '@dma-library/actions'
import { IOperation, WithCollateralAndWithdrawal, WithDebt } from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import {
  WithAaveV2StrategyAddresses,
  WithFlashloan,
  WithNetwork,
  WithOptionalDeposit,
  WithProxy,
  WithSwap,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

export type AdjustRiskDownArgs = WithCollateralAndWithdrawal &
  WithDebt &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAaveV2StrategyAddresses &
  WithNetwork

export type AaveV2AdjustDownOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}: AdjustRiskDownArgs) => Promise<IOperation>

export const adjustRiskDown: AaveV2AdjustDownOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}) => {
  const setDaiApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: flashloan.token.amount,
    asset: addresses.DAI,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v2.aaveDeposit(network, {
    amount: flashloan.token.amount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v2.aaveWithdraw(network, {
    amount: collateral.withdrawal.amount,
    asset: collateral.address,
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
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v2.aavePayback(
    network,
    {
      asset: debt.address,
      amount: new BigNumber(0),
      paybackAll: false,
    },
    [0, 3, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw(network, {
    asset: addresses.DAI,
    amount: flashloan.token.amount,
    to: addresses.operationExecutor,
  })

  const flashloanCalls = [
    setDaiApprovalOnLendingPool,
    depositDaiInAAVE,
    withdrawCollateralFromAAVE,
    swapCollateralTokensForDebtTokens,
    setDebtTokenApprovalOnLendingPool,
    paybackInAAVE,
    withdrawDAIFromAAVE,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: addresses.DAI,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.DssFlash,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: getAaveAdjustDownV2OperationDefinition(network).name,
  }
}
