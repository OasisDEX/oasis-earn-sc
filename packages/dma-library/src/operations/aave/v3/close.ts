import * as actions from '@dma-library/actions'
import {
  IOperation,
  WithAaveV3StrategyAddresses,
  WithCollateral,
  WithDebt,
  WithFlashloan,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { MAX_UINT, ZERO } from '@oasisdex/dma-common/constants'
import { aaveCloseV3OperationDefinition } from '@oasisdex/dma-deployments/operation-definitions'
import BigNumber from 'bignumber.js'

type CloseArgs = WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPositionAndLockedCollateral &
  WithAaveV3StrategyAddresses

export async function close({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
}: CloseArgs): Promise<IOperation> {
  const setEModeOnCollateral = actions.aave.v3.aaveV3SetEMode({
    categoryId: 0,
  })
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
    amount: new BigNumber(MAX_UINT),
    to: proxy.address,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: position.collateral.amount || ZERO,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: debt.address,
      delegate: addresses.pool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v3.aaveV3Payback({
    asset: debt.address,
    amount: new BigNumber(0),
    paybackAll: true,
  })

  const withdrawDAIFromAAVE = actions.aave.v3.aaveV3Withdraw({
    asset: addresses.DAI,
    amount: flashloan.amount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  const returnDebtFunds = actions.common.returnFunds({
    asset: debt.isEth ? addresses.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds({
    asset: collateral.isEth ? addresses.ETH : collateral.address,
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    isDPMProxy: proxy.isDPMProxy,
    asset: addresses.DAI,
    flashloanAmount: flashloan.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: [
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
    ],
  })

  return {
    calls: [takeAFlashLoan, setEModeOnCollateral],
    operationName: aaveCloseV3OperationDefinition.name,
  }
}
