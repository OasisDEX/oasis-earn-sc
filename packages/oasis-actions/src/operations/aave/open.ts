import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { OPERATION_NAMES } from '../../helpers/constants'
import { IOperation } from '../../strategies/types/IOperation'
import { AAVEStrategyAddresses } from './addresses'

export async function open(
  args: {
    flashloanAmount: BigNumber
    borrowAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    swapAmountInWei: BigNumber
    collateralTokenAddress: string
    debtTokenAddress: string
    proxy: string
  },
  addresses: AAVEStrategyAddresses,
): Promise<IOperation> {
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    delegate: addresses.aaveLendingPool,
  })

  const depositDaiInAAVE = actions.aave.aaveDeposit({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
  })

  const borrowEthFromAAVE = actions.aave.aaveBorrow({
    amount: args.borrowAmount,
    asset: addresses.ETH,
    to: args.proxy,
  })

  const needsEthToBeWrapped = addresses.ETH === args.debtTokenAddress
  const wrapEth = actions.common.wrapEth({
    amount: args.swapAmountInWei,
  })

  const swapDebtTokensForCollateralTokens = actions.common.swap({
    fromAsset: args.debtTokenAddress,
    toAsset: args.collateralTokenAddress,
    amount: args.swapAmountInWei,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: true,
  })

  const setCollateralTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      amount: 0,
      asset: args.collateralTokenAddress,
      delegate: addresses.aaveLendingPool,
    },
    [0, 0, 3],
  )

  const depositCollateral = actions.aave.aaveDeposit(
    {
      asset: args.collateralTokenAddress,
      amount: 0,
    },
    [0, 3],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  let calls = []
  if (needsEthToBeWrapped) {
    calls = [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      borrowEthFromAAVE,
      wrapEth,
      swapDebtTokensForCollateralTokens,
      setCollateralTokenApprovalOnLendingPool,
      depositCollateral,
      withdrawDAIFromAAVE,
    ]
  } else {
    calls = [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      borrowEthFromAAVE,
      swapDebtTokensForCollateralTokens,
      setCollateralTokenApprovalOnLendingPool,
      depositCollateral,
      withdrawDAIFromAAVE,
    ]
  }

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: OPERATION_NAMES.aave.OPEN_POSITION,
  }
}
