import { getAaveOpenV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { NULL_ADDRESS, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  Protocol,
  WithCollateral,
  WithDebtAndBorrow,
  WithEMode,
  WithFlashloan,
  WithNetwork,
  WithOptionalDeposit,
  WithPosition,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import { WithAaveLikeStrategyAddresses } from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type OpenOperationArgs = WithCollateral &
  WithDebtAndBorrow &
  WithOptionalDeposit &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPosition &
  WithEMode &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type AaveV3OpenOperation = ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  emode,
  addresses,
  network,
}: OpenOperationArgs) => Promise<IOperation>

export const open: AaveV3OpenOperation = async ({
  collateral,
  debt,
  deposit,
  swap,
  flashloan,
  proxy,
  position,
  emode,
  addresses,
  network,
}) => {
  const depositAmount = deposit?.amount || ZERO
  const depositAddress = deposit?.address || NULL_ADDRESS

  const isDepositingCollateral = deposit?.address === collateral.address
  const isDepositingDebtTokens = deposit?.address === debt.address

  const pullDebtTokensToProxy = actions.common.pullToken(network, {
    asset: debt.address,
    amount: isDepositingDebtTokens ? depositAmount : ZERO,
    from: proxy.owner,
  })

  const pullCollateralTokensToProxy = actions.common.pullToken(network, {
    asset: collateral.address,
    amount: isDepositingCollateral ? depositAmount : ZERO,
    from: proxy.owner,
  })

  const setFlashloanTokenApprovalOnAave = actions.common.setApproval(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositFlashloanAsCollateral = actions.aave.v3.aaveV3Deposit(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    sumAmounts: false,
  })

  const borrowDebtTokensFromAAVE = actions.aave.v3.aaveV3Borrow(network, {
    amount: debt.borrow.amount,
    asset: debt.address,
    to: proxy.address,
  })

  const wrapEth = actions.common.wrapEth(network, {
    amount: new BigNumber(ethers.constants.MaxUint256.toHexString()),
  })

  const swapDebtTokensForCollateralTokens = actions.common.swap(network, {
    fromAsset: debt.address,
    toAsset: collateral.address,
    amount: swap.amount,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const depositIsCollateral = depositAddress === collateral.address
  const setCollateralTokenApprovalOnLendingPool = actions.common.setApproval(
    network,
    {
      asset: collateral.address,
      delegate: addresses.lendingPool,
      amount: depositIsCollateral ? depositAmount : ZERO,
      sumAmounts: true,
    },
    [0, 0, 3, 0],
  )

  const depositCollateral = actions.aave.v3.aaveV3Deposit(
    network,
    {
      asset: collateral.address,
      amount: depositIsCollateral ? depositAmount : ZERO,
      sumAmounts: true,
      setAsCollateral: true,
    },
    [0, 3, 0, 0],
  )

  const withdrawFlashloanAssetFromAave = actions.aave.v3.aaveV3Withdraw(network, {
    asset: flashloan.token.address,
    amount: flashloan.token.amount,
    to: addresses.operationExecutor,
  })

  const protocol: Protocol = 'AAVE_V3'

  const positionCreated = actions.common.positionCreated(network, {
    protocol,
    positionType: position.type,
    collateralToken: collateral.address,
    debtToken: debt.address,
  })

  const hasAmountToDeposit = depositAmount.gt(ZERO)
  pullDebtTokensToProxy.skipped = isDepositingCollateral || !hasAmountToDeposit || debt.isEth
  pullCollateralTokensToProxy.skipped =
    isDepositingDebtTokens || !hasAmountToDeposit || collateral.isEth
  wrapEth.skipped = !debt.isEth && !collateral.isEth

  depositFlashloanAsCollateral.skipped = false //flashloan.token.address === debt.address
  borrowDebtTokensFromAAVE.skipped = false // flashloan.token.address === debt.address

  const setEModeOnCollateral = actions.aave.v3.aaveV3SetEMode(network, {
    categoryId: emode.categoryId || 0,
  })

  setEModeOnCollateral.skipped = !emode.categoryId || emode.categoryId === 0

  const flashloanCalls = [
    pullDebtTokensToProxy,
    pullCollateralTokensToProxy,
    setFlashloanTokenApprovalOnAave,
    depositFlashloanAsCollateral,
    borrowDebtTokensFromAAVE,
    wrapEth,
    swapDebtTokensForCollateralTokens,
    setCollateralTokenApprovalOnLendingPool,
    depositCollateral,
    setEModeOnCollateral,
    withdrawFlashloanAssetFromAave,
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
    operationName: getAaveOpenV3OperationDefinition(network).name,
  }
}
