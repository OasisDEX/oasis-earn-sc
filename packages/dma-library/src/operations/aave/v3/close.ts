import BigNumber from 'bignumber.js'

import * as actions from '@dma-library/actions'
import { getActionHash } from '@dma-library/actions/getActionHash'
import { ADDRESSES } from '@dma-library/utils/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '@dma-library/utils/constants'
import { IOperation } from '@dma-library/types'
import { AAVEV3StrategyAddresses } from './addresses'
import { MAX_UINT } from '@oasisdex/dma-common/constants'
import { FlashloanProvider } from '@dma-library/types/common'

export const operationDefinition = {
  name: OPERATION_NAMES.aave.v3.CLOSE_POSITION,
  actions: [
    {
      hash: getActionHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.SET_APPROVAL),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.DEPOSIT),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.WITHDRAW),
      optional: false,
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
      hash: getActionHash(CONTRACT_NAMES.aave.v3.PAYBACK),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.WITHDRAW),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.UNWRAP_ETH),
      optional: true,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.RETURN_FUNDS),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.common.RETURN_FUNDS),
      optional: false,
    },
    {
      hash: getActionHash(CONTRACT_NAMES.aave.v3.SET_EMODE),
      optional: false,
    },
  ],
}

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
    collateralIsEth: boolean
    debtTokenAddress: string
    debtTokenIsEth: boolean
    isDPMProxy: boolean
    shouldCloseToCollateral: boolean
  },
  addresses: AAVEV3StrategyAddresses,
): Promise<IOperation> {
  const setEModeOnCollateral = actions.aave.v3.aaveV3SetEMode({
    categoryId: 0,
  })
  const setDaiApprovalOnLendingPool = actions.common.setApproval({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    delegate: addresses.pool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v3.aaveV3Deposit({
    amount: args.flashloanAmount,
    asset: addresses.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v3.aaveV3Withdraw({
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
      delegate: addresses.pool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v3.aaveV3Payback({
    asset: args.debtTokenAddress,
    amount: new BigNumber(0),
    paybackAll: true,
  })

  const withdrawDAIFromAAVE = actions.aave.v3.aaveV3Withdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  const returnDebtFunds = actions.common.returnFunds({
    asset: args.debtTokenIsEth ? ADDRESSES.main.ETH : args.debtTokenAddress,
  })

  const returnCollateralFunds = actions.common.returnFunds({
    asset: args.collateralIsEth ? ADDRESSES.main.ETH : args.collateralTokenAddress,
  })

  unwrapEth.skipped = !args.debtTokenIsEth && !args.collateralIsEth

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    isDPMProxy: args.isDPMProxy,
    asset: addresses.DAI,
    flashloanAmount: args.flashloanAmount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.DssFlash,
    calls: [
      setDaiApprovalOnLendingPool,
      depositDaiInAAVE,
      withdrawCollateralFromAAVE,
      swapCollateralTokensForDebtTokens,
      setDebtTokenApprovalOnLendingPool,
      paybackInAAVE,
      withdrawDAIFromAAVE,
      unwrapEth,
      returnDebtFunds,
      returnCollateralFunds,
    ],
  })

  return {
    calls: [takeAFlashLoan, setEModeOnCollateral],
    operationName: operationDefinition.name,
  }
}
