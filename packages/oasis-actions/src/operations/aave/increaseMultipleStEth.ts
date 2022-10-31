import BigNumber from 'bignumber.js'

import * as actions from '../../actions'

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
  addresses: IncreaseMultipleStEthAddresses,
) {
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
    to: args.dsProxy,
  })

  const wrapEth = actions.common.wrapEth({
    amount: args.ethSwapAmount,
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
    to: addresses.operationExecutor,
  })

  console.log()
  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: args.dsProxy,
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

  return [takeAFlashLoan]
}
