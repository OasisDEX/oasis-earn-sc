import { getMorphoBlueCloseOperationDefinition } from '@deploy-configurations/operation-definitions'
import { FEE_BASE, MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  IOperation,
  WithCollateral,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { WithAaveLikeStrategyAddresses, WithMorphoBlueMarket } from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

export type MorphoBlueCloseArgs = WithMorphoBlueMarket &
  WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPositionAndLockedCollateral &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type MorphoBlueCloseOperation = ({
  morphoBlueMarket,
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}: MorphoBlueCloseArgs) => Promise<IOperation>

export const close: MorphoBlueCloseOperation = async ({
  morphoBlueMarket,
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  network,
}) => {
  if (collateral.address !== morphoBlueMarket.collateralToken) {
    throw new Error('Collateral token must be the same as MorphoBlue market collateral token')
  }
  if (debt.address !== morphoBlueMarket.loanToken) {
    throw new Error('Debt token must be the same as MorphoBlue market debt token')
  }

  const setDebtTokenApprovalOnPool = actions.common.setApproval(network, {
    asset: debt.address,
    delegate: addresses.lendingPool,
    amount: flashloan.token.amount,
    sumAmounts: false,
  })

  const paybackDebt = actions.morphoblue.payback(network, {
    morphoBlueMarket: morphoBlueMarket,
    amount: ZERO,
  })

  const withdrawCollateral = actions.morphoblue.withdraw(network, {
    morphoBlueMarket: morphoBlueMarket,
    amount: new BigNumber(MAX_UINT),
    to: proxy.address,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const sendDebtToOpExecutor = actions.common.sendToken(network, {
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: flashloan.token.amount.plus(BALANCER_FEE.div(FEE_BASE).times(flashloan.token.amount)),
  })

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: debt.isEth ? addresses.tokens.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: collateral.isEth ? addresses.tokens.ETH : collateral.address,
  })

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: flashloan.token.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: [
      setDebtTokenApprovalOnPool,
      paybackDebt,
      withdrawCollateral,
      swapCollateralTokensForDebtTokens,
      sendDebtToOpExecutor,
      unwrapEth,
    ],
  })

  return {
    calls: [takeAFlashLoan, returnDebtFunds, returnCollateralFunds],
    operationName: getMorphoBlueCloseOperationDefinition(network).name,
  }
}
