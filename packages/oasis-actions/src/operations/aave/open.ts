import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import * as actions from '../../actions'
import { OPERATION_NAMES, ZERO } from '../../helpers/constants'
import { IOperation } from '../../strategies/types/IOperation'
import { Address } from '../../strategies/types/IPositionRepository'
import { AAVEStrategyAddresses } from './addresses'

export async function open(
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
    collateralTokenAddress: Address
    debtTokenAddress: Address
    useFlashloan: boolean
    proxy: Address
    user: Address
  },
  addresses: AAVEStrategyAddresses,
): Promise<IOperation> {
  const pullDebtTokensToProxy = actions.common.pullToken({
    asset: args.debtTokenAddress,
    amount: args.depositDebtTokens.amountInWei,
    from: args.user,
  })

  const pullCollateralTokensToProxy = actions.common.pullToken({
    asset: args.collateralTokenAddress,
    amount: args.depositCollateral.amountInWei,
    from: args.user,
  })

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

  const borrowDebtTokensFromAAVE = actions.aave.aaveBorrow({
    amount: args.borrowAmountInWei,
    asset: args.debtTokenAddress,
    to: args.proxy,
  })

  const wrapEth = actions.common.wrapEth({
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const swapDebtTokensForCollateralTokens = actions.common.swap({
    fromAsset: args.debtTokenAddress,
    toAsset: args.collateralTokenAddress,
    amount: args.swapAmountInWei,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: args.collectFeeFrom === 'sourceToken',
  })

  const setCollateralTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: args.collateralTokenAddress,
      delegate: addresses.aaveLendingPool,
      amount: args.depositCollateral.amountInWei,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositCollateral = actions.aave.aaveDeposit(
    {
      asset: args.collateralTokenAddress,
      amount: args.depositCollateral.amountInWei,
      sumAmounts: true,
      setAsCollateral: true,
    },
    [0, 3, 0, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
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
    dsProxyFlashloan: true,
    calls: flashloanCalls,
  })

  const calls = [takeAFlashLoan]
  const operationName = OPERATION_NAMES.aave.OPEN_POSITION

  return {
    calls,
    operationName,
  }
}
