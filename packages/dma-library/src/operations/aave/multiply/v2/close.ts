import { ADDRESSES } from '@deploy-configurations/addresses'
import { getAaveCloseV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { IOperation } from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'

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
  network: Network
}

export type AaveV2CloseOperation = (
  args: CloseArgs,
  addresses: AaveLikeStrategyAddresses,
) => Promise<IOperation>

export const close: AaveV2CloseOperation = async (args, addresses) => {
  const { network } = args
  const setDaiApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: args.flashloanAmount,
    asset: addresses.tokens.DAI,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v2.aaveDeposit(network, {
    amount: args.flashloanAmount,
    asset: addresses.tokens.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v2.aaveWithdraw(network, {
    asset: args.collateralTokenAddress,
    amount: new BigNumber(MAX_UINT),
    to: args.proxy,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: args.collateralTokenAddress,
    toAsset: args.debtTokenAddress,
    amount: args.collateralAmountToBeSwapped,
    receiveAtLeast: args.receiveAtLeast,
    fee: args.fee,
    withData: args.swapData,
    collectFeeInFromToken: args.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    network,
    {
      asset: args.debtTokenAddress,
      delegate: addresses.lendingPool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v2.aavePayback(network, {
    asset: args.debtTokenAddress,
    amount: new BigNumber(0),
    paybackAll: true,
  })

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw(network, {
    asset: addresses.tokens.DAI,
    amount: args.flashloanAmount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  // Also covers the return of dust amount funds to the user - in the close to collateral scenario
  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: args.debtTokenIsEth ? ADDRESSES[Network.MAINNET].common.ETH : args.debtTokenAddress,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: args.collateralIsEth
      ? ADDRESSES[Network.MAINNET].common.ETH
      : args.collateralTokenAddress,
  })

  unwrapEth.skipped = !args.debtTokenIsEth && !args.collateralIsEth

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    flashloanAmount: args.flashloanAmount,
    asset: addresses.tokens.DAI,
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

  return { calls: [takeAFlashLoan], operationName: getAaveCloseV2OperationDefinition(network).name }
}
