import BigNumber from 'bignumber.js'

import * as actions from '../actions'
import { ADDRESSES } from '../helpers/addresses'
import { CONTRACT_NAMES } from '../helpers/constants'
import { ServiceRegistry } from '../types/ServiceRegistry'

export interface OpenStEthAddresses {
  DAI: string
  ETH: string
  WETH: string
  stETH: string
}

export async function openStEth(
  registry: ServiceRegistry,
  addresses: OpenStEthAddresses,
  args: {
    depositAmount: BigNumber
    flashloanAmount: BigNumber
    borrowAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    ethSwapAmount: BigNumber
  },
) {
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount.plus(args.depositAmount),
    asset: addresses.DAI,
    delegator: ADDRESSES.main.aave.MainnetLendingPool,
  })

  const depositDaiInAAVE = actions.aave.aaveDeposit({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
  })

  const borrowEthFromAAVE = actions.aave.aaveBorrow({
    amount: args.borrowAmount,
    asset: addresses.ETH,
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
      delegator: ADDRESSES.main.aave.MainnetLendingPool,
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
  })

  const sendBackDAI = actions.common.sendToken({
    asset: addresses.DAI,
    to: await registry.getServiceAddress(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
    amount: args.flashloanAmount,
  })

  const takeAFlashloan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: await registry.getServiceAddress(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
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

  return [
    // pullToken,
    takeAFlashloan,
  ]
}
