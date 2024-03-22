import { getSparkMigrateOperationDefinition } from '@deploy-configurations/operation-definitions'
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
  WithMigrationStrategyAddresses,
} from '@dma-library/types/strategy-params'
import BigNumber from 'bignumber.js'

export type MigrateOperationArgs = WithDebt &
  WithAToken &
  WithVDToken &
  WithFlashloan &
  WithAaveLikeStrategyAddresses &
  WithNetwork &
  WithPositionType &
  WithMigrationSource &
  WithMigrationStrategyAddresses

export type SparkMigrateOperation = ({
  aToken,
  vdToken,
  flashloan,
  addresses,
  network,
  sourceAddress,
  operationExecutor,
}: MigrateOperationArgs) => Promise<IOperation>

export const migrate: SparkMigrateOperation = async ({
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

  const tokenBalance = actions.common.tokenBalance(network, {
    asset: vdToken.address,
    owner: sourceAccount,
  })

  const approvalAction = actions.common.setApproval(
    network,
    {
      asset: depositToken,
      delegate: addresses.lendingPool,
      amount: amount,
      sumAmounts: false,
    },
    [0, 0, 0, 0],
  )

  const depositAction = actions.spark.deposit(
    network,
    {
      asset: depositToken,
      amount: amount,
      sumAmounts: false,
      setAsCollateral: true,
    },
    [0, 0, 0, 0],
  )

  const borrowAction = actions.spark.borrow(
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

  const paybackAction = actions.spark.payback(
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
    amount: aToken.amount,
    from: sourceAccount,
  })

  const withdrawAction = actions.spark.withdraw(network, {
    asset: depositToken,
    amount: amount,
    to: operationExecutor,
  })

  const positionCreated = actions.common.positionCreated(network, {
    protocol: 'Spark',
    positionType,
    collateralToken: depositToken,
    debtToken: borrowToken,
  })

  const calls = [
    tokenBalance,
    approvalAction,
    depositAction,
    borrowAction,
    approval2Action,
    paybackAction,
    pullTokenAction2,
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
    operationName: getSparkMigrateOperationDefinition(network).name,
  }
}
