import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import * as actions from '../../../actions'
import { OPERATION_NAMES, ZERO } from '../../../helpers/constants'
import { IOperation } from '../../../types'
import { AAVEStrategyAddresses } from './addresses'

export async function adjustRiskUp(
  args: {
    depositCollateral: {
      amountInWei: BigNumber
      isEth: boolean
    }
    depositDebtTokens: {
      amountInWei: BigNumber
      isEth: boolean
    }
    flashloanAmount: BigNumber
    borrowAmountInWei: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    swapData: string | number
    swapAmountInWei: BigNumber
    collectFeeFrom: 'sourceToken' | 'targetToken'
    fromTokenAddress: string
    toTokenAddress: string
    useFlashloan: boolean
    proxy: string
    user: string
    isDPMProxy: boolean
  },
  addresses: AAVEStrategyAddresses,
): Promise<IOperation> {
  const pullDebtTokensToProxy = actions.common.pullToken({
    asset: args.fromTokenAddress,
    amount: args.depositDebtTokens.amountInWei,
    from: args.user,
  })

  const pullCollateralTokensToProxy = actions.common.pullToken({
    asset: args.toTokenAddress,
    amount: args.depositCollateral.amountInWei,
    from: args.user,
  })

  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v2.aaveDeposit({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const borrowDebtTokensFromAAVE = actions.aave.v2.aaveBorrow({
    amount: args.borrowAmountInWei,
    asset: args.fromTokenAddress,
    to: args.proxy,
  })

  const wrapEth = actions.common.wrapEth({
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const swapDebtTokensForCollateralTokens = actions.common.swap({
    fromAsset: args.fromTokenAddress,
    toAsset: args.toTokenAddress,
    amount: args.swapAmountInWei,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: args.collectFeeFrom === 'sourceToken',
  })

  const setCollateralTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: args.toTokenAddress,
      delegate: addresses.lendingPool,
      amount: args.depositCollateral.amountInWei,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositCollateral = actions.aave.v2.aaveDeposit(
    {
      asset: args.toTokenAddress,
      amount: args.depositCollateral.amountInWei,
      sumAmounts: true,
      setAsCollateral: true,
    },
    [0, 3, 0, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  pullDebtTokensToProxy.skipped =
    args.depositDebtTokens.amountInWei.eq(ZERO) || args.depositDebtTokens.isEth
  pullCollateralTokensToProxy.skipped =
    args.depositCollateral.amountInWei.eq(ZERO) || args.depositCollateral.isEth
  wrapEth.skipped = !args.depositDebtTokens.isEth && !args.depositCollateral.isEth

  const flashloanCalls = [
    pullDebtTokensToProxy,
    pullCollateralTokensToProxy,
    setDaiApprovalOnLendingPool,
    depositDaiInAAVE,
    borrowDebtTokensFromAAVE,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnLendingPool,
    depositCollateral,
    withdrawDAIFromAAVE,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    borrower: addresses.operationExecutor,
    isProxyFlashloan: true,
    isDPMProxy: args.isDPMProxy,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: OPERATION_NAMES.aave.v2.INCREASE_POSITION,
  }
}
