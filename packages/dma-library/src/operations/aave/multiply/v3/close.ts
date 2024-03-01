import { getAaveCloseV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
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
import { WithAaveLikeStrategyAddresses } from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

export type CloseArgs = WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPositionAndLockedCollateral &
  WithAaveLikeStrategyAddresses &
  WithNetwork

export type AaveV3CloseOperation = ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  position,
  addresses,
  network,
}: CloseArgs) => Promise<IOperation>

export const close: AaveV3CloseOperation = async ({
  collateral,
  debt,
  swap,
  flashloan,
  proxy,
  position: {
    collateral: { amount: collateralAmountToBeSwapped },
  },
  addresses,
  network,
}) => {
  const setEModeOnCollateral = actions.aave.v3.aaveV3SetEMode(network, {
    categoryId: 0,
  })
  const setFlashLoanApproval = actions.common.setApproval(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    delegate: addresses.lendingPool,
    sumAmounts: false,
  })

  const depositFlashLoan = actions.aave.v3.aaveV3Deposit(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    sumAmounts: false,
  })

  // const collateralToWithdraw =
  //   collateral.address === flashloan.token.address
  //     ? collateralAmountToBeSwapped
  //     : new BigNumber(MAX_UINT)

  const withdrawCollateralFromAAVE = actions.aave.v3.aaveV3Withdraw(network, {
    asset: collateral.address,
    amount: collateralAmountToBeSwapped,
    to: proxy.address,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: collateralAmountToBeSwapped || ZERO,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const swapActionStorageIndex = 3
  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    network,
    {
      asset: debt.address,
      delegate: addresses.lendingPool,
      amount: ZERO,
      sumAmounts: true,
    },
    [0, 0, swapActionStorageIndex, 0],
  )

  const paybackInAAVE = actions.aave.v3.aaveV3Payback(network, {
    asset: debt.address,
    amount: ZERO,
    paybackAll: true,
    onBehalfOf: proxy.address,
  })

  const withdrawFlashLoan = actions.aave.v3.aaveV3Withdraw(network, {
    asset: flashloan.token.address,
    amount: flashloan.token.amount,
    to: addresses.operationExecutor,
  })

  const withdrawCollateral = actions.aave.v3.aaveV3Withdraw(network, {
    asset: collateral.address,
    amount: new BigNumber(MAX_UINT),
    to: proxy.address,
  })

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: debt.isEth ? addresses.tokens.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: collateral.isEth ? addresses.tokens.ETH : collateral.address,
  })

  unwrapEth.skipped = !debt.isEth && !collateral.isEth

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    isDPMProxy: proxy.isDPMProxy,
    asset: flashloan.token.address,
    flashloanAmount: flashloan.token.amount,
    isProxyFlashloan: true,
    provider: flashloan.provider,
    calls: [
      setFlashLoanApproval,
      depositFlashLoan,
      withdrawCollateralFromAAVE,
      swapCollateralTokensForDebtTokens,
      setDebtTokenApprovalOnLendingPool,
      paybackInAAVE,
      withdrawFlashLoan,
      withdrawCollateral,
      unwrapEth,
      returnDebtFunds,
      returnCollateralFunds,
    ],
  })

  return {
    calls: [takeAFlashLoan, setEModeOnCollateral],
    operationName: getAaveCloseV3OperationDefinition(network).name,
  }
}
