import BigNumber from 'bignumber.js'

import * as actions from '../../../actions'
import { OPERATION_NAMES } from '../../../helpers/constants'
import { IOperation, WithCollateralAndWithdrawal, WithDebt } from '../../../types'
import {
  WithAaveV2StrategyAddresses,
  WithFlashloan,
  WithOptionalDeposit,
  WithProxy,
  WithSwap,
} from '../../../types/Operations'
import { FlashloanProvider } from '../../../types/common'

type AdjustRiskDownArgs = WithCollateralAndWithdrawal &
  WithDebt &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAaveV2StrategyAddresses

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
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v2.aaveDeposit({
    amount: flashloan.amount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v2.aaveWithdraw({
    amount: collateral.withdrawal.amount,
    asset: collateral.address,
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
      delegate: addresses.lendingPool,
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v2.aavePayback(
    {
      asset: debt.address,
      amount: new BigNumber(0),
      paybackAll: false,
    },
    [0, 3, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw({
    asset: addresses.DAI,
    amount: flashloan.amount,
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

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    isDPMProxy: proxy.isDPMProxy,
    asset: addresses.DAI,
    flashloanAmount: flashloan.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.DssFlash,
    calls: flashloanCalls,
  })

  return { calls: [takeAFlashLoan], operationName: OPERATION_NAMES.aave.v2.DECREASE_POSITION }
}
