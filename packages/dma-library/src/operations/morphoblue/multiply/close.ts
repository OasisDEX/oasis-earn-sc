import { getMorphoBlueCloseOperationDefinition } from '@deploy-configurations/operation-definitions'
import { FEE_BASE, MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  IOperation,
  SwapFeeType,
  WithCollateral,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithPaybackDebt,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSwap,
  WithWithdrawCollateral,
} from '@dma-library/types'
import {
  WithMorphoBlueMarket,
  WithMorphpBlueStrategyAddresses,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

export type MorphoBlueCloseArgs = WithMorphoBlueMarket &
  WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPositionAndLockedCollateral &
  WithMorphpBlueStrategyAddresses &
  WithNetwork &
  WithPaybackDebt &
  WithWithdrawCollateral

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
  amountDebtToPaybackInBaseUnit,
  amountCollateralToWithdrawInBaseUnit,
}) => {
  if (collateral.address !== morphoBlueMarket.collateralToken) {
    throw new Error('Collateral token must be the same as MorphoBlue market collateral token')
  }
  if (debt.address !== morphoBlueMarket.loanToken) {
    throw new Error('Debt token must be the same as MorphoBlue market debt token')
  }

  const setDebtTokenApprovalOnPool = actions.common.setApproval(network, {
    asset: debt.address,
    delegate: addresses.morphoblue,
    amount: flashloan.token.amount,
    sumAmounts: false,
  })

  const paybackDebt = actions.morphoblue.payback(network, {
    morphoBlueMarket: morphoBlueMarket,
    amount: amountDebtToPaybackInBaseUnit,
    onBehalf: proxy.address,
    paybackAll: true,
  })

  const withdrawCollateral = actions.morphoblue.withdraw(network, {
    morphoBlueMarket: morphoBlueMarket,
    amount: amountCollateralToWithdrawInBaseUnit,
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
    feeType: swap.feeType ?? SwapFeeType.Percentage,
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
