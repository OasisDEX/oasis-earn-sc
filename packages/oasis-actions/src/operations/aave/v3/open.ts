import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import * as actions from '../../../actions'
import { OPERATION_NAMES, ZERO } from '../../../helpers/constants'
import { Address, IOperation, PositionType, Protocol } from '../../../types'
import { AAVEV3StrategyAddresses } from './addresses'

interface OpenArgs {
  deposit: {
    collateralToken: { amountInBaseUnit: BigNumber; isEth: boolean }
    debtToken: { amountInBaseUnit: BigNumber; isEth: boolean }
  }
  swapArgs: {
    fee: number
    swapData: string | number
    swapAmountInBaseUnit: BigNumber
    collectFeeFrom: 'sourceToken' | 'targetToken'
    receiveAtLeast: BigNumber
  }
  positionType: PositionType
  addresses: AAVEV3StrategyAddresses
  flashloanAmount: BigNumber
  borrowAmountInBaseUnit: BigNumber
  collateralTokenAddress: Address
  debtTokenAddress: Address
  useFlashloan: boolean
  proxy: Address
  user: Address
  isDPMProxy: boolean
}

export async function openV3({
  deposit,
  swapArgs,
  addresses,
  flashloanAmount,
  borrowAmountInBaseUnit,
  collateralTokenAddress,
  debtTokenAddress,
  proxy,
  user,
  isDPMProxy,
  positionType,
}: OpenArgs): Promise<IOperation> {
  const pullDebtTokensToProxy = actions.common.pullToken({
    asset: debtTokenAddress,
    amount: deposit.debtToken.amountInBaseUnit,
    from: user,
  })

  const pullCollateralTokensToProxy = actions.common.pullToken({
    asset: collateralTokenAddress,
    amount: deposit.collateralToken.amountInBaseUnit,
    from: user,
  })

  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: flashloanAmount,
    asset: addresses.DAI,
    delegate: addresses.pool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.aaveV3Deposit({
    amount: flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const borrowDebtTokensFromAAVE = actions.aave.aaveV3Borrow({
    amount: borrowAmountInBaseUnit,
    asset: debtTokenAddress,
    to: proxy,
  })

  const wrapEth = actions.common.wrapEth({
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const swapDebtTokensForCollateralTokens = actions.common.swap({
    fromAsset: debtTokenAddress,
    toAsset: collateralTokenAddress,
    amount: swapArgs.swapAmountInBaseUnit,
    receiveAtLeast: swapArgs.receiveAtLeast,
    fee: swapArgs.fee,
    withData: swapArgs.swapData,
    collectFeeInFromToken: swapArgs.collectFeeFrom === 'sourceToken',
  })

  const setCollateralTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: collateralTokenAddress,
      delegate: addresses.pool,
      amount: deposit.collateralToken.amountInBaseUnit,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositCollateral = actions.aave.aaveV3Deposit(
    {
      asset: collateralTokenAddress,
      amount: deposit.collateralToken.amountInBaseUnit,
      sumAmounts: true,
      setAsCollateral: true,
    },
    [0, 3, 0, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveV3Withdraw({
    asset: addresses.DAI,
    amount: flashloanAmount,
    to: addresses.operationExecutor,
  })

  const protocol: Protocol = 'AAVE'

  const positionCreated = actions.common.positionCreated({
    protocol,
    positionType,
    collateralToken: collateralTokenAddress,
    debtToken: debtTokenAddress,
  })

  // TODO: Redeploy all new OpNames to registry
  pullDebtTokensToProxy.skipped =
    deposit.debtToken.amountInBaseUnit.eq(ZERO) || deposit.debtToken.isEth
  pullCollateralTokensToProxy.skipped =
    deposit.collateralToken.amountInBaseUnit.eq(ZERO) || deposit.collateralToken.isEth
  wrapEth.skipped = !deposit.debtToken.isEth && !deposit.collateralToken.isEth

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
    positionCreated,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    isDPMProxy,
    flashloanAmount: flashloanAmount,
    borrower: addresses.operationExecutor,
    isProxyFlashloan: true,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: OPERATION_NAMES.aave.v3.OPEN_POSITION,
  }
}
