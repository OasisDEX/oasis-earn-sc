import { aaveOpenV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { ZERO } from '@dma-common/constants'
import { Address } from '@dma-common/types/address'
import { actions } from '@dma-library/actions'
import { FlashloanProvider } from '@dma-library/types/common'
import { IOperation } from '@dma-library/types/operations'
import { PositionType } from '@dma-library/types/position-type'
import { Protocol } from '@dma-library/types/protocol'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { AAVEStrategyAddresses } from './addresses'

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
  addresses: AAVEStrategyAddresses
  flashloanAmount: BigNumber
  borrowAmountInBaseUnit: BigNumber
  collateralTokenAddress: Address
  debtTokenAddress: Address
  useFlashloan: boolean
  proxy: Address
  user: Address
  isDPMProxy: boolean
}

export type AaveV2OpenOperation = ({
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
}: OpenArgs) => Promise<IOperation>

export const open: AaveV2OpenOperation = async ({
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
}) => {
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
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v2.aaveDeposit({
    amount: flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const borrowDebtTokensFromAAVE = actions.aave.v2.aaveBorrow({
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
      delegate: addresses.lendingPool,
      amount: deposit.collateralToken.amountInBaseUnit,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositCollateral = actions.aave.v2.aaveDeposit(
    {
      asset: collateralTokenAddress,
      amount: deposit.collateralToken.amountInBaseUnit,
      sumAmounts: true,
      setAsCollateral: true,
    },
    [0, 3, 0, 0],
  )

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw({
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
    asset: addresses.DAI,
    flashloanAmount: flashloanAmount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.DssFlash,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: aaveOpenV2OperationDefinition.name,
  }
}
