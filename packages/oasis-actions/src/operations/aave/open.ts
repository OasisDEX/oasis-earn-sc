import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import * as actions from '../../actions'
import { ZERO } from '../../helpers/constants'
import { IOperation } from '../../strategies/types/IOperation'
import { Address } from '../../strategies/types/IPositionRepository'
import { AAVEStrategyAddresses } from './addresses'

type Protocol = 'AAVE' | 'Maker'
type PositionType = 'Earn' | 'Multiply'

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
  addresses: AAVEStrategyAddresses
  flashloanAmount: BigNumber
  borrowAmountInWei: BigNumber
  collateralTokenAddress: Address
  debtTokenAddress: Address
  positionId: number
  positionType: PositionType
  protocol: Protocol
  proxy: Address
  user: Address
}

export async function open({
  deposit,
  swapArgs,
  addresses,
  flashloanAmount,
  borrowAmountInWei,
  collateralTokenAddress,
  debtTokenAddress,
  positionId,
  positionType,
  protocol,
  proxy,
  user,
}: OpenArgs): Promise<IOperation> {
  const use = {
    pullDebtTokensInToProxy:
      deposit.debtToken.amountInBaseUnit.gt(ZERO) && !deposit.debtToken.isEth,
    pullCollateralInToProxy:
      deposit.collateralToken.amountInBaseUnit.gt(ZERO) && !deposit.collateralToken.isEth,
  }

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
    delegate: addresses.aaveLendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.aaveDeposit({
    amount: flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const borrowDebtTokensFromAAVE = actions.aave.aaveBorrow({
    amount: borrowAmountInWei,
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
      delegate: addresses.aaveLendingPool,
      amount: deposit.collateralToken.amountInBaseUnit,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositCollateral = actions.aave.aaveDeposit(
    {
      asset: collateralTokenAddress,
      amount: deposit.collateralToken.amountInBaseUnit,
      sumAmounts: true,
      setAsCollateral: true,
    },
    [0, 3, 0, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.aaveWithdraw({
    asset: addresses.DAI,
    amount: flashloanAmount,
    to: addresses.operationExecutor,
  })

  const positionCreated = actions.common.positionCreated({
    proxyAddress: proxy,
    positionId: positionId,
    protocol: protocol,
    positionType: positionType,
    collateralToken: collateralTokenAddress,
    debtToken: debtTokenAddress,
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
    positionCreated,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: flashloanAmount,
    borrower: addresses.operationExecutor,
    dsProxyFlashloan: true,
    calls: flashloanCalls,
  })

  const calls = [takeAFlashLoan]
  use.pullDebtTokensInToProxy && calls.unshift(pullDebtTokensToProxy)
  use.pullCollateralInToProxy && calls.unshift(pullCollateralTokensToProxy)

  return {
    calls,
    operationName: 'CUSTOM_OPERATION', // TODO: Disabled for now until OpRegistry has been rediscussed
  }
}
