import { ADDRESSES } from '@oasisdex/deploy-configurations/addresses'
import { getAaveCloseV2OperationDefinition } from '@oasisdex/deploy-configurations/operation-definitions'
import { Network } from '@oasisdex/deploy-configurations/types'
import { MAX_UINT, ZERO } from '@oasisdex/dma-common/constants'
import BigNumber from 'bignumber.js'

import { actions } from '../../../../actions'
import { FlashloanProvider } from '../../../../types'
import {
  IOperation,
  WithAaveLikeStrategyAddresses,
  WithCollateral,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSwap,
} from '../../../../types/operations'

export type CloseArgs = WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPositionAndLockedCollateral &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type AaveV2CloseOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  network,
}: CloseArgs) => Promise<IOperation>

export const close: AaveV2CloseOperation = async args => {
  const {
    collateral,
    debt,
    proxy,
    position: {
      collateral: { amount: collateralAmountToBeSwapped },
    },
    network,
    swap,
    flashloan,
    addresses,
  } = args
  const setDaiApprovalOnLendingPool = actions.common.setApproval(network, {
    amount: flashloan.token.amount,
    asset: addresses.tokens.DAI,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositDaiInAAVE = actions.aave.v2.aaveDeposit(network, {
    amount: flashloan.token.amount,
    asset: addresses.tokens.DAI,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v2.aaveWithdraw(network, {
    asset: collateral.address,
    amount: new BigNumber(MAX_UINT),
    to: proxy.address,
  })

  const swapActionStorageIndex = 3
  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: collateralAmountToBeSwapped || ZERO,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    network,
    {
      asset: debt.address,
      delegate: addresses.lendingPool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, swapActionStorageIndex, 0],
  )

  const paybackInAAVE = actions.aave.v2.aavePayback(network, {
    asset: debt.address,
    amount: new BigNumber(0),
    paybackAll: true,
  })

  const withdrawDAIFromAAVE = actions.aave.v2.aaveWithdraw(network, {
    asset: addresses.tokens.DAI,
    amount: flashloan.token.amount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  // Also covers the return of dust amount funds to the user - in the close to collateral scenario
  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: debt.isEth ? ADDRESSES[Network.MAINNET].common.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: collateral.isEth ? ADDRESSES[Network.MAINNET].common.ETH : collateral.address,
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    flashloanAmount: flashloan.token.amount,
    asset: addresses.tokens.DAI,
    isProxyFlashloan: true,
    isDPMProxy: proxy.isDPMProxy,
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
