import { getMorphoBlueOpenOperationDefinition } from '@deploy-configurations/operation-definitions'
import { NULL_ADDRESS, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  Protocol,
  WithCollateral,
  WithDebtAndBorrow,
  WithFlashloan,
  WithNetwork,
  WithOptionalDeposit,
  WithPosition,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import {
  WithMorphoBlueMarket,
  WithMorphpBlueStrategyAddresses,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type MorphoBlueOpenOperationArgs = WithMorphoBlueMarket &
  WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPosition &
  WithMorphpBlueStrategyAddresses &
  WithNetwork

export type MorphoBlueOpenOperation = ({
  morphoBlueMarket,
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  network,
}: MorphoBlueOpenOperationArgs) => Promise<IOperation>

export const open: MorphoBlueOpenOperation = async ({
  morphoBlueMarket,
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  network,
}) => {
  const depositAmount = deposit?.amount || ZERO
  const depositAddress = deposit?.address || NULL_ADDRESS

  if (depositAddress !== collateral.address) {
    throw new Error('Deposit token must be the same as collateral token')
  }
  if (collateral.address !== morphoBlueMarket.collateralToken) {
    throw new Error('Collateral token must be the same as MorphoBlue market collateral token')
  }
  if (debt.address !== morphoBlueMarket.loanToken) {
    throw new Error('Debt token must be the same as MorphoBlue market debt token')
  }

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
  wrapEth.skipped = !debt.isEth && !collateral.isEth

  // No previous actions store values with OpStorage
  const swapActionStorageIndex = 1
  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
    fromAsset: debt.address,
    toAsset: collateral.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setCollateralApproval = actions.common.setApproval(
    network,
    {
      amount: depositAmount,
      asset: collateral.address,
      delegate: addresses.morphoblue,
      sumAmounts: true,
    },
    [0, 0, swapActionStorageIndex, 0],
  )

  const depositCollateral = actions.morphoblue.deposit(
    network,
    {
      morphoBlueMarket: morphoBlueMarket,
      amount: depositAmount,
      sumAmounts: true,
    },
    [swapActionStorageIndex, 0],
  )

  const borrowDebtTokens = actions.morphoblue.borrow(network, {
    morphoBlueMarket: morphoBlueMarket,
    amount: debt.borrow.amount,
  })

  const sendQuoteTokenToOpExecutor = actions.common.sendToken(network, {
    asset: debt.address,
    to: addresses.operationExecutor,
    amount: debt.borrow.amount,
  })

  const protocol: Protocol = 'MorphoBlue'

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
    setCollateralApproval,
    depositCollateral,
    borrowDebtTokens,
    sendQuoteTokenToOpExecutor,
    positionCreated,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: flashloan.token.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: flashloanCalls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: getMorphoBlueOpenOperationDefinition(network).name,
  }
}
