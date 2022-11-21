import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import * as actions from '../../actions'
import { IOperation } from '../../strategies/types/IOperation'
import { AAVEStrategyAddresses } from './addresses'

export interface IncreaseMultipleStEthAddresses {
  DAI: string
  ETH: string
  WETH: string
  stETH: string
  operationExecutor: string
  chainlinkEthUsdPriceFeed: string
  aavePriceOracle: string
  aaveLendingPool: string
}

export async function increaseMultipleStEth(
  args: {
    flashloanAmount: BigNumber
    borrowAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    ethSwapAmount: BigNumber
    dsProxy: string
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

  const borrowEthFromAAVE = actions.aave.aaveBorrow({
    amount: args.borrowAmount,
    asset: addresses.WETH,
    to: args.dsProxy,
  })

  const wrapEth = actions.common.wrapEth({
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const swapETHforSTETH = actions.common.swap({
    fromAsset: addresses.WETH,
    toAsset: addresses.stETH,
    amount: args.ethSwapAmount,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: true,
  })

  const setSethApprovalOnLendingPool = actions.common.setApproval(
    {
      amount: 0,
      asset: addresses.stETH,
      delegate: addresses.aaveLendingPool,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositSTETH = actions.aave.aaveDeposit(
    {
      asset: addresses.stETH,
      amount: 0,
      sumAmounts: false,
    },
    [0, 3, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls: [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      borrowEthFromAAVE,
      wrapEth,
      swapETHforSTETH,
      setSethApprovalOnLendingPool,
      depositSTETH,
      withdrawDAIFromAAVE,
    ],
  })

  return { calls: [takeAFlashLoan], operationName: 'CUSTOM_OPERATION' }
}
