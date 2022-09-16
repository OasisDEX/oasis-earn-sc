import BigNumber from 'bignumber.js'

import * as actions from '../../actions'

export interface DecreaseMultipleStEthAddresses {
  DAI: string
  ETH: string
  WETH: string
  stETH: string
  operationExecutor: string
  chainlinkEthUsdPriceFeed: string
  aavePriceOracle: string
  aaveLendingPool: string
}

export async function decreaseMultipleStEth(
  args: {
    flashloanAmount: BigNumber
    withdrawAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    ethSwapAmount: BigNumber
    dsProxy: string
  },
  addresses: DecreaseMultipleStEthAddresses,
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

  const withdrawStEthFromAAVE = actions.aave.aaveBorrow({
    amount: args.withdrawAmount,
    asset: addresses.stETH,
    to: args.dsProxy,
  })

  const wrapEth = actions.common.wrapEth({
    amount: args.ethSwapAmount,
  })

  const swapSTETHforETH = actions.common.swap({
    fromAsset: addresses.stETH,
    toAsset: addresses.WETH,
    amount: args.ethSwapAmount,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: false,
  })

  const setSethApprovalOnLendingPool = actions.common.setApproval(
    {
      amount: 0,
      asset: addresses.stETH,
      delegate: addresses.aaveLendingPool,
    },
    [0, 0, 3],
  )

  const depositETH = actions.aave.aaveDeposit(
    {
      asset: addresses.ETH,
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

  // TODO: determine if a flashloan is necessary
  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls: [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      withdrawStEthFromAAVE,
      wrapEth,
      swapSTETHforETH,
      setSethApprovalOnLendingPool,
      depositETH,
      withdrawDAIFromAAVE,
      sendBackDAI,
    ],
  })

  return [takeAFlashLoan]
}
