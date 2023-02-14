import BigNumber from 'bignumber.js'

import * as actions from '../../../actions'
import { ADDRESSES } from '../../../helpers/addresses'
import { MAX_UINT, OPERATION_NAMES } from '../../../helpers/constants'
import { IOperation } from '../../../types'
import { AAVEV3StrategyAddresses } from './addresses'

export async function close(
  args: {
    lockedCollateralAmountInWei: BigNumber
    flashloanAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    proxy: string
    collectFeeFrom: 'sourceToken' | 'targetToken'
    collateralTokenAddress: string
    collateralIsEth: boolean
    debtTokenAddress: string
    debtTokenIsEth: boolean
    isDPMProxy: boolean
    shouldCloseToCollateral: boolean
  },
  addresses: AAVEV3StrategyAddresses,
): Promise<IOperation> {
  const setEModeOnCollateral = actions.aave.v3.aaveV3SetEMode({
    categoryId: 0,
  })
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    delegate: addresses.pool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v3.aaveV3Deposit({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v3.aaveV3Withdraw({
    asset: args.collateralTokenAddress,
    amount: new BigNumber(MAX_UINT),
    to: args.proxy,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: args.collateralTokenAddress,
    toAsset: args.debtTokenAddress,
    amount: args.lockedCollateralAmountInWei,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: args.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: args.debtTokenAddress,
      delegate: addresses.pool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v3.aaveV3Payback({
    asset: args.debtTokenAddress,
    amount: new BigNumber(0),
    paybackAll: true,
  })

  const withdrawDAIFromAAVE = actions.aave.v3.aaveV3Withdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  const returnDebtFunds = actions.common.returnFunds({
    asset: args.debtTokenIsEth ? ADDRESSES.main.ETH : args.debtTokenAddress,
  })
  returnDebtFunds.skipped = args.shouldCloseToCollateral

  const returnCollateralFunds = actions.common.returnFunds({
    asset: args.collateralIsEth ? ADDRESSES.main.ETH : args.collateralTokenAddress,
  })

  const sendRemainingDebtFundsToFeeRecipient = actions.common.sendToken({
    asset: args.debtTokenAddress,
    to: ADDRESSES.main.feeRecipient,
    amount: new BigNumber(MAX_UINT),
  })
  sendRemainingDebtFundsToFeeRecipient.skipped = !args.shouldCloseToCollateral

  unwrapEth.skipped = !args.debtTokenIsEth && !args.collateralIsEth

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    isProxyFlashloan: true,
    isDPMProxy: args.isDPMProxy,
    calls: [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      withdrawCollateralFromAAVE,
      swapCollateralTokensForDebtTokens,
      setDebtTokenApprovalOnLendingPool,
      paybackInAAVE,
      withdrawDAIFromAAVE,
      sendRemainingDebtFundsToFeeRecipient,
      unwrapEth,
      returnDebtFunds,
      returnCollateralFunds,
    ],
  })

  return {
    calls: [takeAFlashLoan, setEModeOnCollateral],
    operationName: OPERATION_NAMES.aave.v3.CLOSE_POSITION,
  }
}
