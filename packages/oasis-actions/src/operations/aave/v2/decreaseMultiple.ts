import BigNumber from 'bignumber.js'

import * as actions from '../../../actions'
import { OPERATION_NAMES } from '../../../helpers/constants'
import { IOperation } from '../../../types'
import { AAVEStrategyAddresses } from './addresses'

export async function decreaseMultiple(
  args: {
    flashloanAmount: BigNumber
    withdrawAmountInWei: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    swapAmountInWei: BigNumber
    collectFeeFrom: 'sourceToken' | 'targetToken'
    fromTokenAddress: string
    toTokenAddress: string
    useFlashloan: boolean
    proxy: string
    user: string
    isDPMProxy: boolean
  },
  addresses: AAVEStrategyAddresses,
): Promise<IOperation> {
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v2.aaveDeposit({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v2.aaveWithdraw({
    amount: args.withdrawAmountInWei,
    asset: args.fromTokenAddress,
    to: args.proxy,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: args.fromTokenAddress,
    toAsset: args.toTokenAddress,
    amount: args.swapAmountInWei,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: args.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      amount: 0,
      asset: args.toTokenAddress,
      delegate: addresses.lendingPool,
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v2.aavePayback(
    {
      asset: args.toTokenAddress,
      amount: new BigNumber(0),
      paybackAll: false,
    },
    [0, 3, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
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
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    isProxyFlashloan: true,
    isDPMProxy: args.isDPMProxy,
    calls: flashloanCalls,
  })

  return { calls: [takeAFlashLoan], operationName: OPERATION_NAMES.aave.v2.DECREASE_POSITION }
}
