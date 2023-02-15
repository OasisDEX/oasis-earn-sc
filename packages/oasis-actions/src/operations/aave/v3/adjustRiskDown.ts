import BigNumber from 'bignumber.js'

import * as actions from '../../../actions'
import { ADDRESSES } from '../../../helpers/addresses'
import { MAX_UINT, OPERATION_NAMES } from '../../../helpers/constants'
import { Address, IOperation } from '../../../types'
import { AAVEV3StrategyAddresses } from './addresses'

interface AdjustRiskDownArgs {
  collateral: {
    toDepositInBaseUnit: BigNumber
    toWithdrawInBaseUnit: BigNumber
    address: Address
    isEth: boolean
  }
  debt: {
    toDepositInBaseUnit: BigNumber
    address: Address
    isEth: boolean
  }
  swapArgs: {
    fee: number
    swapData: string | number
    swapAmountInBaseUnit: BigNumber
    collectFeeFrom: 'sourceToken' | 'targetToken'
    receiveAtLeast: BigNumber
  }
  addresses: AAVEV3StrategyAddresses
  flashloanAmount: BigNumber
  borrowAmountInBaseUnit: BigNumber
  eModeCategoryId: number
  useFlashloan: boolean
  proxy: Address
  isDPMProxy: boolean
}

export async function adjustRiskDown({
  collateral,
  debt,
  swapArgs,
  addresses,
  flashloanAmount,
  eModeCategoryId,
  proxy,
  isDPMProxy,
}: AdjustRiskDownArgs): Promise<IOperation> {
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: flashloanAmount,
    asset: addresses.DAI,
    delegate: addresses.pool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v3.aaveV3Deposit({
    amount: flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v3.aaveV3Withdraw({
    asset: collateral.address,
    amount: collateral.toWithdrawInBaseUnit,
    to: proxy,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swapArgs.swapAmountInBaseUnit,
    receiveAtLeast: swapArgs.receiveAtLeast,
    fee: swapArgs.fee,
    withData: swapArgs.swapData,
    collectFeeInFromToken: swapArgs.collectFeeFrom === 'sourceToken',
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
    amount: flashloanAmount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  const returnDebtFunds = actions.common.returnFunds({
    asset: debt.isEth ? ADDRESSES.main.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds({
    asset: collateral.isEth ? ADDRESSES.main.ETH : collateral.address,
  })

  const setEModeOnCollateral = actions.aave.v3.aaveV3SetEMode({
    categoryId: eModeCategoryId || 0,
  })

  setEModeOnCollateral.skipped = !eModeCategoryId || eModeCategoryId === 0

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
    setEModeOnCollateral,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    isDPMProxy,
    flashloanAmount: flashloanAmount,
    borrower: addresses.operationExecutor,
    isProxyFlashloan: true,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: OPERATION_NAMES.aave.v3.ADJUST_RISK_DOWN,
  }
}
