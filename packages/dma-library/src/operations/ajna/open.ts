import { getAjnaOpenOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { FEE_BASE, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import {
  FlashloanProvider,
  IOperation,
  Protocol,
  WithAjnaBucketPrice,
  WithCollateral,
  WithDebtAndBorrow,
  WithFlashloan,
  WithNetwork,
  WithOptionalDeposit,
  WithPosition,
  WithProxy,
  WithSummerStrategyAddresses,
  WithSwap,
} from '@dma-library/types'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

type OpenArgs = WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPosition &
  WithSummerStrategyAddresses &
  WithAjnaBucketPrice &
  WithNetwork

export type AjnaOpenOperation = ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  price,
  network,
}: OpenArgs) => Promise<IOperation>

export const open: AjnaOpenOperation = async ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  price,
  network,
}) => {
  const depositAmount = deposit?.amount || ZERO

  const pullCollateralTokensToProxy = actions.common.pullToken(network, {
    asset: collateral.address,
    amount: depositAmount,
    from: proxy.owner,
  })

  const wrapEth = actions.common.wrapEth(network, {
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const hasAmountToDeposit = depositAmount.gt(ZERO)
  pullCollateralTokensToProxy.skipped = !hasAmountToDeposit || collateral.isEth
  const shouldSkipWrapEth = !collateral.isEth
  wrapEth.skipped = shouldSkipWrapEth

  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
    fromAsset: debt.address,
    toAsset: collateral.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  // We do not need to dynamically calculate index here
  // Because not all actions store values in OpStorage
  const setCollateralTokenApprovalOnPool = actions.common.setApproval(
    network,
    {
      asset: collateral.address,
      delegate: addresses.pool,
      amount: depositAmount,
      sumAmounts: true,
    },
    [0, 0, 1, 0],
  )

  const depositBorrow = actions.ajna.ajnaDepositBorrow(
    network,
    {
      quoteToken: debt.address,
      collateralToken: collateral.address,
      depositAmount,
      borrowAmount: debt.borrow.amount,
      sumDepositAmounts: true,
      price,
    },
    [0, 0, 1, 0, 0, 0],
  )

  const sendQuoteTokenToOpExecutor = actions.common.sendToken(network, {
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: flashloan.amount.plus(BALANCER_FEE.div(FEE_BASE).times(flashloan.amount)),
  })

  const protocol: Protocol = network === Network.MAINNET ? 'Ajna_rc13' : 'Ajna_rc14'

  const positionCreated = actions.common.positionCreated(network, {
    protocol,
    positionType: position.type,
    collateralToken: collateral.address,
    debtToken: debt.address,
  })

  const flashloanCalls = [
    pullCollateralTokensToProxy,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnPool,
    depositBorrow,
    sendQuoteTokenToOpExecutor,
    positionCreated,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: flashloan.token.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: FlashloanProvider.Balancer,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: getAjnaOpenOperationDefinition(network).name,
  }
}
