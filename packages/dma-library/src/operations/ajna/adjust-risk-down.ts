import { ajnaAdjustDownOperationDefinition } from '@deploy-configurations/operation-definitions/ajna/adjust-down'
import { MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithFlashloan,
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
  WithAjnaBucketPrice

export type AjnaAdjustRiskDownOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
}: AjnaAdjustRiskDownArgs) => Promise<IOperation>

export const adjustRiskDown: AjnaAdjustRiskDownOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  addresses,
  price,
}) => {
  const swapCollateralTokensForDebtTokens = actions.common.swap({
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnPool = actions.common.setApproval(
    {
      asset: debt.address,
      delegate: addresses.pool,
      amount: flashloan.amount,
      sumAmounts: false,
    },
    [0, 0, 1, 0],
  )

  const paybackWithdraw = actions.ajna.ajnaPaybackWithdraw(
    {
      pool: addresses.pool,
      withdrawAmount: collateral.withdrawal.amount,
      paybackAmount: flashloan.amount,
      price,
    },
    [0, 1, 0, 0, 0, 0],
  )

  const unwrapEth = actions.common.unwrapEth({
    amount: new BigNumber(MAX_UINT),
  })

  const returnDebtFunds = actions.common.returnFunds({
    asset: debt.isEth ? addresses.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds({
    asset: collateral.isEth ? addresses.ETH : collateral.address,
  })

  const flashloanCalls = [
    setDebtTokenApprovalOnPool,
    paybackWithdraw,
    swapCollateralTokensForDebtTokens,
    unwrapEth,
    returnDebtFunds,
    returnCollateralFunds,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan({
    isDPMProxy: proxy.isDPMProxy,
    asset: debt.address,
    flashloanAmount: flashloan.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.Balancer,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: ajnaAdjustDownOperationDefinition.name,
  }
}
