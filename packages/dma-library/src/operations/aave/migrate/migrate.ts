import { getAaveV3MigrateOperationDefinition } from '@deploy-configurations/operation-definitions'
import { MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { IOperation, WithFlashloan, WithNetwork, WithPositionType } from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithAToken,
  WithDebt,
  WithVDToken,
} from '@dma-library/types/operations'
import {
  WithMigrationSource,
  WithOperationExecutorOvveride,
} from '@dma-library/types/strategy-params'
import BigNumber from 'bignumber.js'

export type MigrateV3OperationArgs = WithDebt &
  WithAToken &
  WithVDToken &
  WithFlashloan &
  WithAaveLikeStrategyAddresses &
  WithNetwork &
  WithPositionType &
  WithMigrationSource &
  WithOperationExecutorOvveride

export type AaveV3MigrateOperation = ({
  aToken,
  vdToken,
  flashloan,
  addresses,
  network,
  sourceAddress,
  positionType,
  operationExecutor,
}: MigrateV3OperationArgs) => Promise<IOperation>

export const migrate: AaveV3MigrateOperation = async ({
  debt,
  flashloan,
  aToken,
  vdToken,
  addresses,
  network,
  positionType,
  sourceAddress,
  operationExecutor,
}) => {
  const amount = flashloan.token.amount
  const depositToken = flashloan.token.address
  const borrowToken = debt.address
  const sourceAccount = sourceAddress

  const variableDebtTokenBalanceOnMigratedPosition = actions.common.tokenBalance(network, {
    asset: vdToken.address,
    owner: sourceAccount,
  })

  const approveFlashloan = actions.common.setApproval(
    network,
    {
      asset: depositToken,
      delegate: addresses.lendingPool,
      amount: amount,
      sumAmounts: false,
    },
    [0, 0, 0, 0],
  )

  const depositFlashLoan = actions.aave.v3.aaveV3Deposit(
    network,
    {
      asset: depositToken,
      amount: amount,
      sumAmounts: false,
      setAsCollateral: true,
    },
    [0, 0, 0, 0],
  )

  const borrowAction = actions.aave.v3.aaveV3Borrow(
    network,
    {
      asset: borrowToken,
      amount: new BigNumber(0), // from mapping
      to: sourceAccount,
    },
    [0, 1, 0],
  )

  const approval2Action = actions.common.setApproval(
    network,
    {
      asset: borrowToken,
      delegate: addresses.lendingPool,
      amount: new BigNumber(0), // from mapping
      sumAmounts: false,
    },
    [0, 0, 1, 0],
  )

  const paybackAction = actions.aave.v3.aaveV3Payback(
    network,
    {
      asset: borrowToken,
      amount: new BigNumber(0), //from mapping
      paybackAll: false,
      onBehalfOf: sourceAccount,
    },
    [0, 1, 0, 0],
  )

  const pullTokenAction2 = actions.common.pullTokenMaxAmount(network, {
    asset: aToken.address,
    amount: new BigNumber(MAX_UINT),
    from: sourceAccount,
  })

  const withdrawAction = actions.aave.v3.aaveV3Withdraw(network, {
    asset: depositToken,
    amount: amount,
    to: operationExecutor,
  })

  const positionCreated = actions.common.positionCreated(network, {
    protocol: 'AAVE_V3',
    positionType,
    collateralToken: depositToken,
    debtToken: borrowToken,
  })

  const calls = [
    variableDebtTokenBalanceOnMigratedPosition, // 0
    approveFlashloan, // 1
    depositFlashLoan, // 2
    borrowAction, // 3
    approval2Action, // 4
    paybackAction, // 5
    pullTokenAction2, // 6
    withdrawAction,
    positionCreated,
  ]

  const takeAFlashLoan = actions.common.takeAFlashLoan(network, {
    flashloanAmount: amount,
    asset: depositToken,
    isProxyFlashloan: true,
    isDPMProxy: true,
    provider: flashloan.provider,
    calls: calls,
  })

  return {
    calls: [takeAFlashLoan],
    operationName: getAaveV3MigrateOperationDefinition(network).name,
  }
}
