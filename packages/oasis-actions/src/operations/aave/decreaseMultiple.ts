import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { OPERATION_NAMES } from '../../helpers/constants'
import { IOperation } from '../../strategies/types/IOperation'
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
    collateralTokenAddress: string
    debtTokenAddress: string
    proxy: string
  },
  addresses: AAVEStrategyAddresses,
): Promise<IOperation> {
  console.log('DECREASING')
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
    amount: args.withdrawAmountInWei,
    asset: args.collateralTokenAddress,
    to: args.proxy,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: args.collateralTokenAddress,
    toAsset: args.debtTokenAddress,
    amount: args.swapAmountInWei,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: args.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      amount: 0,
      asset: args.debtTokenAddress,
      delegate: addresses.aaveLendingPool,
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.aavePayback(
    {
      asset: args.debtTokenAddress,
      amount: new BigNumber(0),
      paybackAll: false,
    },
    [0, 3, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  // TODO: determine if a flashloan is necessary
  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls: [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      withdrawCollateralFromAAVE,
      swapCollateralTokensForDebtTokens,
      setDebtTokenApprovalOnLendingPool,
      paybackInAAVE,
      withdrawDAIFromAAVE,
    ],
  })

  return { calls: [takeAFlashLoan], operationName: 'CUSTOM_OPERATION' }
}
