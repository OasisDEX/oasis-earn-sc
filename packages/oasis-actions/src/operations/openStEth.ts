import BigNumber from 'bignumber.js'

import * as actions from '../actions'

export interface OpenStEthAddresses {
  DAI: string
  ETH: string
  WETH: string
  stETH: string
  operationExecutor: string
  chainlinkEthUsdPriceFeed: string
  aavePriceOracle: string
  aaveLendingPool: string
}

export async function openStEth(
  args: {
    depositAmount: BigNumber
    flashloanAmount: BigNumber
    borrowAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    ethSwapAmount: BigNumber
    dsProxy: string
  },
  addresses: OpenStEthAddresses,
) {
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount.plus(args.depositAmount),
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
    to: args.dsProxy,
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
    },
    [0, 0, 3],
  )

  const depositSTETH = actions.aave.aaveDeposit(
    {
      asset: addresses.stETH,
      amount: 0,
    },
    [0, 3],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: args.dsProxy,
  })

  const sendBackDAI = actions.common.sendToken({
    asset: addresses.DAI,
    to: addresses.operationExecutor,
    amount: args.flashloanAmount,
  })

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls: [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      borrowEthFromAAVE,
      swapETHforSTETH,
      setSethApprovalOnLendingPool,
      depositSTETH,
      withdrawDAIFromAAVE,
      sendBackDAI,
    ],
  })

  return [takeAFlashLoan]
}
