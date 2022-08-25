import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import * as actions from '../../actions'

export interface CloseStEthAddresses {
  DAI: string
  ETH: string
  WETH: string
  stETH: string
  operationExecutor: string
  chainlinkEthUsdPriceFeed: string
  aavePriceOracle: string
  aaveLendingPool: string
}

export async function closeStEth(
  args: {
    stEthAmount: BigNumber
    flashloanAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    ethSwapAmount: BigNumber
    dsProxy: string
  },
  addresses: CloseStEthAddresses,
) {

const setDaiApprovalOnLendingPool = actions.common.setApproval({
  amount: args.flashloanAmount,
  asset: addresses.DAI,
  delegator: addresses.aaveLendingPool,
})

  const depositDaiInAAVE = actions.aave.aaveDeposit({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
  })

  const withdrawstEthFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.stETH,
    amount: args.stEthAmount,
    to: args.dsProxy,
  })

  const swapSTETHforETH = actions.common.swap({
    fromAsset: addresses.stETH,
    toAsset: addresses.WETH,
    amount: args.ethSwapAmount,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: true,
  })

  const setWethApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount,
    asset: addresses.WETH,
    delegator: addresses.aaveLendingPool,
  },
  [0, 0, 3],
  )

  const paybackInAAVE = actions.aave.aavePayback({
    amount: new BigNumber(0),
    asset: addresses.WETH,
    paybackAll: true
  })


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
      withdrawstEthFromAAVE,
      swapSTETHforETH,
      setWethApprovalOnLendingPool,
      paybackInAAVE,
      withdrawDAIFromAAVE,
    ],
  })

  return [takeAFlashLoan]

}
