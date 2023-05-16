import { ADDRESSES } from '@deploy-configurations/addresses'
import { aaveCloseV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { IOperation } from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'

import { AAVEStrategyAddresses } from './addresses'

type CloseArgs = {
  collateralAmountToBeSwapped: BigNumber
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
}

export type AaveV2CloseOperation = (
  args: CloseArgs,
  addresses: AAVEStrategyAddresses,
) => Promise<IOperation>

export const close: AaveV2CloseOperation = async (args, addresses) => {
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

  const withdrawCollateralFromAAVE = actions.aave.v2.aaveWithdraw({
    asset: args.collateralTokenAddress,
    amount: new BigNumber(MAX_UINT),
    to: args.proxy,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: args.collateralTokenAddress,
    toAsset: args.debtTokenAddress,
    amount: args.collateralAmountToBeSwapped,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: args.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    {
      asset: args.debtTokenAddress,
      delegate: addresses.lendingPool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v2.aavePayback({
    asset: args.debtTokenAddress,
    amount: new BigNumber(0),
    paybackAll: true,
  })

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw({
    asset: addresses.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  // Also covers the return of dust amount funds to the user - in the close to collateral scenario
  const returnDebtFunds = actions.common.returnFunds({
    asset: args.debtTokenIsEth ? ADDRESSES[Network.MAINNET].common.ETH : args.debtTokenAddress,
  })

  const returnCollateralFunds = actions.common.returnFunds({
    asset: args.collateralIsEth
      ? ADDRESSES[Network.MAINNET].common.ETH
      : args.collateralTokenAddress,
  })

  unwrapEth.skipped = !args.debtTokenIsEth && !args.collateralIsEth

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    flashloanAmount: args.flashloanAmount,
    asset: addresses.DAI,
    isProxyFlashloan: true,
    isDPMProxy: args.isDPMProxy,
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

  return { calls: [takeAFlashLoan], operationName: aaveCloseV2OperationDefinition.name }
}
