import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { ADDRESSES } from '../../helpers/addresses'
import { MAX_UINT } from '../../helpers/constants'
import { IOperation } from '../../strategies/types/IOperation'
import { AAVEStrategyAddresses } from './addresses'

export async function close(
  args: {
    lockedCollateralAmountInWei: BigNumber
    flashloanAmount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    proxy: string
    collectFeeFrom: 'sourceToken' | 'targetToken'
    collateralTokenAddress: string
    debtTokenAddress: string
    debtTokenIsEth: boolean
  },
  addresses: AAVEStrategyAddresses,
): Promise<IOperation> {
  console.log('OP-FLASH:', args.flashloanAmount.toString())
  console.log('OP-LOCKED:', args.lockedCollateralAmountInWei.toString())

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

  const withdrawCollateralFromAAVE = actions.aave.aaveWithdraw({
    asset: args.collateralTokenAddress,
    amount: new BigNumber(MAX_UINT),
    to: args.proxy,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: args.collateralTokenAddress,
    toAsset: args.debtTokenAddress,
    amount: args.lockedCollateralAmountInWei,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: args.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: args.debtTokenAddress,
      delegate: addresses.aaveLendingPool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.aavePayback({
    asset: args.debtTokenAddress,
    amount: new BigNumber(0),
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
    asset: args.debtTokenIsEth ? ADDRESSES.main.ETH : args.debtTokenAddress,
  })

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls: [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      withdrawCollateralFromAAVE,
      swapCollateralTokensForDebtTokens,
      setDebtTokenApprovalOnLendingPool,
      paybackInAAVE,
      withdrawDAIFromAAVE,
      unwrapEth,
      returnFunds,
    ],
  })

  return { calls: [takeAFlashLoan], operationName: 'CUSTOM_OPERATION' }
}
