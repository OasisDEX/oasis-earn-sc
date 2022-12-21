import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { ADDRESSES } from '../../helpers/addresses'
import { MAX_UINT, OPERATION_NAMES } from '../../helpers/constants'
import { IOperation } from '../../strategies/types'
import { AAVEStrategyAddresses } from './addresses'

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
  },
  addresses: AAVEStrategyAddresses,
): Promise<IOperation> {
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    delegate: addresses.aaveLendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.aaveDeposit({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.aaveWithdraw({
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
      delegate: addresses.aaveLendingPool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.aavePayback({
    asset: args.debtTokenAddress,
    amount: new BigNumber(0),
    paybackAll: true,
  })

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
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

  const returnCollateralFunds = actions.common.returnFunds({
    asset: args.collateralIsEth ? ADDRESSES.main.ETH : args.collateralTokenAddress,
  })

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
      unwrapEth,
      returnDebtFunds,
      returnCollateralFunds,
    ],
  })

  return { calls: [takeAFlashLoan], operationName: OPERATION_NAMES.aave.CLOSE_POSITION }
}
