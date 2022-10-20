import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { MAX_UINT, OPERATION_NAMES } from '../../helpers/constants'
import { IOperation } from '../../strategies/types/IOperation'
import { AAVEStrategyAddresses } from './addresses'

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
    stEthSwapAmount: BigNumber
    dsProxy: string
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

  const withdrawStEthFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.stETH,
    amount: args.withdrawAmount,
    to: args.dsProxy,
  })

  const swapSTETHforETH = actions.common.swap({
    fromAsset: addresses.stETH,
    toAsset: addresses.WETH,
    amount: args.stEthSwapAmount,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: false,
  })

  const setWethApprovalOnLendingPool = actions.common.setApproval(
    {
      amount: 0,
      asset: addresses.WETH,
      delegate: addresses.aaveLendingPool,
    },
    [0, 0, 3],
  )

  const paybackInAAVE = actions.aave.aavePayback(
    {
      asset: addresses.WETH,
      amount: new BigNumber(0),
      paybackAll: false,
    },
    [0, 3, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
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
      swapSTETHforETH,
      setWethApprovalOnLendingPool,
      paybackInAAVE,
      withdrawDAIFromAAVE,
    ],
  })

  return { calls: [takeAFlashLoan], operationName: OPERATION_NAMES.aave.DECREASE_POSITION }
}
