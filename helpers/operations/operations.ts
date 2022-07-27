import BigNumber from 'bignumber.js'

import { makeActions } from '../actions'
import { ADDRESSES } from '../addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '../constants'
import { ServiceRegistry } from '../wrappers/serviceRegistry'

type Addresses = typeof ADDRESSES['main']

export async function makeOperation(registry: ServiceRegistry, addresses: Addresses) {
  const actions = await makeActions(registry)

  async function openStEth(args: {
    account: string
    depositAmount: BigNumber
    flashloanAmount: BigNumber
    borrowAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
  }) {
    // PULL TOKEN ACTION
    const pullToken = await actions.pullToken({
      amount: args.depositAmount,
      asset: addresses.DAI,
      from: args.account,
    })

    // APPROVE LENDING POOL
    const setDaiApprovalOnLendingPool = await actions.setApproval({
      amount: args.flashloanAmount.plus(args.depositAmount),
      asset: addresses.DAI,
      delegator: ADDRESSES.main.aave.MainnetLendingPool,
    })

    // DEPOSIT IN AAVE
    const depositDaiInAAVE = await actions.aaveDeposit({
      amount: args.flashloanAmount.plus(args.depositAmount),
      asset: addresses.DAI,
    })

    // BORROW FROM AAVE
    const borrowEthFromAAVE = await actions.aaveBorrow({
      amount: args.borrowAmount,
      asset: addresses.ETH,
    })

    const swapETHforSTETH = await actions.swap({
      fromAsset: addresses.WETH,
      toAsset: addresses.stETH,
      amount: args.borrowAmount,
      receiveAtLeast: args.receiveAtLeast,
      fee: args.fee,
      withData: args.swapData,
      collectFeeInFromToken: true,
    })

    // WITHDRAW TOKENS
    const withdrawDAIFromAAVE = await actions.aaveWithdraw({
      asset: addresses.DAI,
      amount: args.flashloanAmount,
    })

    // SEND BACK TOKEN FROM PROXY TO EXECUTOR ( FL Borrower )
    const sendBackDAI = await actions.sendToken({
      asset: addresses.DAI,
      to: await registry.getServiceAddress(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
      amount: args.flashloanAmount,
    })

    // TAKE A FLASHLOAN ACTION
    const takeAFlashloan = await actions.takeAFlashLoan({
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
