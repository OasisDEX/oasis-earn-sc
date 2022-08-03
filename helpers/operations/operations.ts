import BigNumber from 'bignumber.js'

import * as actions from '../actions'
import { ADDRESSES } from '../addresses'
import { CONTRACT_NAMES } from '../constants'
import { ServiceRegistry } from '../wrappers/serviceRegistry'

type Addresses = typeof ADDRESSES['main']

export async function makeOperation(registry: ServiceRegistry, addresses: Addresses) {
  async function openStEth(args: {
    account: string
    depositAmount: BigNumber
    flashloanAmount: BigNumber
    borrowAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
  }) {
    const pullToken = await actions.common.pullToken({
      amount: args.depositAmount,
      asset: addresses.DAI,
      from: args.account,
    })

    const setDaiApprovalOnLendingPool = await actions.common.setApproval({
      amount: args.flashloanAmount.plus(args.depositAmount),
      asset: addresses.DAI,
      delegator: ADDRESSES.main.aave.MainnetLendingPool,
    })

    const depositDaiInAAVE = await actions.aave.aaveDeposit({
      amount: args.flashloanAmount.plus(args.depositAmount),
      asset: addresses.DAI,
    })

    const borrowEthFromAAVE = await actions.aave.aaveBorrow({
      amount: args.borrowAmount,
      asset: addresses.ETH,
    })

    const swapETHforSTETH = await actions.common.swap({
      fromAsset: addresses.WETH,
      toAsset: addresses.stETH,
      amount: args.borrowAmount,
      receiveAtLeast: args.receiveAtLeast,
      fee: args.fee,
      withData: args.swapData,
      collectFeeInFromToken: true,
    })

    const withdrawDAIFromAAVE = await actions.aave.aaveWithdraw({
      asset: addresses.DAI,
      amount: args.flashloanAmount,
    })

    const sendBackDAI = await actions.common.sendToken({
      asset: addresses.DAI,
      to: await registry.getServiceAddress(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
      amount: args.flashloanAmount,
    })

    const takeAFlashloan = await actions.common.takeAFlashLoan({
      flashloanAmount: args.flashloanAmount,
      borrower: await registry.getServiceAddress(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
      dsProxyFlashloan: true,
      calls: [
        setDaiApprovalOnLendingPool,
        depositDaiInAAVE,
        borrowEthFromAAVE,
        swapETHforSTETH,
        withdrawDAIFromAAVE,
        sendBackDAI,
      ],
    })

    return [pullToken, takeAFlashloan]
  }

  return {
    openStEth,
  }
}
