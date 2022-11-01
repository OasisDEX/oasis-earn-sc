import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import * as actions from '../../actions'
import { OPERATION_NAMES, OperationNames, ZERO } from '../../helpers/constants'
import { IOperation } from '../../strategies/types/IOperation'
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
    collateralTokenAddress: string
    debtTokenAddress: string
    proxy: string
  },
  addresses: AAVEStrategyAddresses,
): Promise<IOperation> {
  const use = {
    depositDebtTokensInToProxy:
      args.depositDebtTokens.amountInWei.gt(ZERO) && !args.depositDebtTokens.isEth,
    depositCollateralInToProxy:
      args.depositCollateral.amountInWei.gt(ZERO) && !args.depositCollateral.isEth,
  }

  const depositDebtTokensToProxy = actions.common.depositFunds({
    asset: args.debtTokenAddress,
    amount: args.depositDebtTokens.amountInWei,
  })

  const depositCollateralTokensToProxy = actions.common.depositFunds({
    asset: args.collateralTokenAddress,
    amount: args.depositCollateral.amountInWei,
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
    collectFeeInFromToken: true,
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
    },
    [0, 3, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  // TODO: Redeploy all new OpNames to registry
  const flashloanCalls = [
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
  use.depositDebtTokensInToProxy && calls.unshift(depositDebtTokensToProxy)
  use.depositCollateralInToProxy && calls.unshift(depositCollateralTokensToProxy)

  // let operationName: OperationNames = OPERATION_NAMES.aave.OPEN_POSITION
  // if (use.sendDepositToProxy) operationName = OPERATION_NAMES.aave.OPEN_POSITION_1
  // if (use.sendCollateralToProxy) operationName = OPERATION_NAMES.aave.OPEN_POSITION_2
  // if (use.sendDepositToProxy && use.sendCollateralToProxy)
  //   operationName = OPERATION_NAMES.aave.OPEN_POSITION_3

  return {
    calls,
    operationName: 'CUSTOM_OPERATION', // TODO: Disabled for now until OpRegistry has been rediscussed
  }
}
