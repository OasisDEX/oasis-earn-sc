import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import * as actions from '../../../actions'
import { getActionHash } from '../../../actions/getActionHash'
import { CONTRACT_NAMES, OPERATION_NAMES, ZERO } from '../../../helpers/constants'
import { Address } from '../../../types'
import { IOperation } from '../../../types/Operations'
import { PositionType } from '../../../types/PositionType'
import { Protocol } from '../../../types/Protocol'
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

export const operationDefinition = {
  name: OPERATION_NAMES.aave.v2.OPEN_POSITION,
  actions: [
    {
      hash: getActionHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.PULL_TOKEN),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.PULL_TOKEN),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SET_APPROVAL),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.DEPOSIT),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.BORROW),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.WRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SWAP_ACTION),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SET_APPROVAL),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.DEPOSIT),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v2.WITHDRAW),
      optional: false,
    },
    { hash: getActionHash(CONTRACT_NAMES.common.POSITION_CREATED), optional: false },
  ],
}

export async function open({
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
    provider: new BigNumber(0),
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: operationDefinition.name,
  }
}
