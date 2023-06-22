import { ajnaAdjustDownOperationDefinition } from '@deploy-configurations/operation-definitions'
import { MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'

type AjnaAdjustRiskDownArgs = WithCollateralAndWithdrawal &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithAjnaStrategyAddresses &
  WithAjnaBucketPrice &
  WithNetwork

export type AjnaAdjustRiskDownOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
  network,
}: AjnaAdjustRiskDownArgs) => Promise<IOperation>

export const adjustRiskDown: AjnaAdjustRiskDownOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
  network,
}) => {
  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnPool = actions.common.setApproval(
    network,
    {
      asset: debt.address,
      delegate: addresses.pool,
      amount: ZERO,
      sumAmounts: false,
    },
    [0, 0, 1, 0],
  )

  const paybackWithdraw = actions.ajna.ajnaPaybackWithdraw(
    {
      quoteToken: debt.address,
      collateralToken: collateral.address,
      withdrawAmount: collateral.withdrawal.amount,
      paybackAmount: ZERO,
      price,
    },
    [0, 0, 0, 1, 0, 0, 0],
  )

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: debt.isEth ? addresses.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: collateral.isEth ? addresses.ETH : collateral.address,
  })

  const flashloanCalls = [
    setDebtTokenApprovalOnPool,
    paybackWithdraw,
    swapCollateralTokensForDebtTokens,
    unwrapEth,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: debt.address,
    flashloanAmount: flashloan.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.Balancer,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan, returnDebtFunds, returnCollateralFunds],
    operationName: ajnaAdjustDownOperationDefinition.name,
  }
}
