import { getAaveCloseV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { MAX_UINT, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  WithAaveV3StrategyAddresses,
  WithCollateral,
  WithDebt,
  WithFlashloan,
  WithNetwork,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSwap,
} from '@dma-library/types'
import BigNumber from 'bignumber.js'

export type CloseArgs = WithCollateral &
  WithDebt &
  WithSwap &
  WithFlashloan &
  WithProxy &
  WithPositionAndLockedCollateral &
  WithAaveV3StrategyAddresses &
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
  position,
  addresses,
  network,
}) => {
  const setEModeOnCollateral = actions.aave.v3.aaveV3SetEMode(network, {
    categoryId: 0,
  })
  const setFlashLoanApproval = actions.common.setApproval(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    delegate: addresses.pool,
    sumAmounts: false,
  })

  const depositFlashLoan = actions.aave.v3.aaveV3Deposit(network, {
    amount: flashloan.token.amount,
    asset: flashloan.token.address,
    sumAmounts: false,
  })

  const withdrawCollateralFromAAVE = actions.aave.v3.aaveV3Withdraw(network, {
    asset: collateral.address,
    amount: new BigNumber(MAX_UINT),
    to: proxy.address,
  })

  const swapCollateralTokensForDebtTokens = actions.common.swap(network, {
    fromAsset: collateral.address,
    toAsset: debt.address,
    amount: position.collateral.amount || ZERO,
    receiveAtLeast: swap.receiveAtLeast,
    fee: swap.fee,
    withData: swap.data,
    collectFeeInFromToken: swap.collectFeeFrom === 'sourceToken',
  })

  const setDebtTokenApprovalOnLendingPool = actions.common.setApproval(
    network,
    {
      asset: debt.address,
      delegate: addresses.pool,
      amount: new BigNumber(0),
      sumAmounts: false,
    },
    [0, 0, 3, 0],
  )

  const paybackInAAVE = actions.aave.v3.aaveV3Payback(network, {
    asset: debt.address,
    amount: new BigNumber(0),
    paybackAll: true,
  })

  const withdrawFlashLoan = actions.aave.v3.aaveV3Withdraw(network, {
    asset: flashloan.token.address,
    amount: flashloan.token.amount,
    to: addresses.operationExecutor,
  })

  const unwrapEth = actions.common.unwrapEth(network, {
    amount: new BigNumber(MAX_UINT),
  })

  const returnDebtFunds = actions.common.returnFunds(network, {
    asset: debt.isEth ? addresses.ETH : debt.address,
  })

  const returnCollateralFunds = actions.common.returnFunds(network, {
    asset: collateral.isEth ? addresses.ETH : collateral.address,
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
