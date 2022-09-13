import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { MAX_UINT } from '../../helpers/constants'

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

  const withdrawStEthFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.stETH,
    amount: args.stEthAmount,
    to: args.dsProxy,
  })

  const swapSTETHforETH = actions.common.swap({
    fromAsset: addresses.stETH,
    toAsset: addresses.WETH,
    amount: args.stEthAmount,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: false,
  })

  const setWethApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: addresses.WETH,
      delegator: addresses.aaveLendingPool,
      amount: new BigNumber(0),
    },
    [0, 0, 3],
  )

  const paybackInAAVE = actions.aave.aavePayback({
    amount: new BigNumber(0),
    asset: addresses.WETH,
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

  const returnFunds = actions.common.returnFunds({
    asset: addresses.ETH,
  })

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls: [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      withdrawStEthFromAAVE,
      swapSTETHforETH,
      setWethApprovalOnLendingPool,
      paybackInAAVE,
      withdrawDAIFromAAVE,
      unwrapEth,
      returnFunds,
    ],
  })

  return [takeAFlashLoan]
}
