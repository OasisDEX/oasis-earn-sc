import { getAaveMigrateEOAV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { MAX_UINT } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  IOperation,
  WithFlashloan,
  WithNetwork,
  WithPositionType,
  WithProxy,
} from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithAToken,
  WithDebt,
  WithVDToken,
} from '@dma-library/types/operations'
import BigNumber from 'bignumber.js'

export type MigrateEOAV3OperationArgs = WithDebt &
  WithAToken &
  WithVDToken &
  WithFlashloan &
  WithProxy &
  WithAaveLikeStrategyAddresses &
  WithNetwork &
  WithPositionType

export type AaveV3MigrateEOAOperation = ({
  aToken,
  vdToken,
  flashloan,
  proxy,
  addresses,
  network,
}: MigrateEOAV3OperationArgs) => Promise<IOperation>

export const migrateEOA: AaveV3MigrateEOAOperation = async ({
  debt,
  flashloan,
  aToken,
  vdToken,
  proxy,
  addresses,
  network,
  positionType,
}) => {
  const amount = flashloan.token.amount
  const depositToken = flashloan.token.address
  const borrowToken = debt.address

  const variableDebtTokenBalanceOnEOA = actions.common.tokenBalance(network, {
    asset: vdToken.address,
    owner: proxy.owner,
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
      to: proxy.owner,
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
      onBehalfOf: proxy.owner,
    },
    [0, 1, 0, 0],
  )

  const pullTokenAction2 = actions.common.pullTokenMaxAmount(network, {
    asset: aToken.address,
    amount: new BigNumber(MAX_UINT),
    from: proxy.owner,
  })

  const withdrawAction = actions.aave.v3.aaveV3Withdraw(network, {
    asset: depositToken,
    amount: amount,
    to: addresses.operationExecutor,
  })

  const positionCreated = actions.common.positionCreated(network, {
    protocol: 'AAVE_V3',
    positionType,
    collateralToken: depositToken,
    debtToken: borrowToken,
  })

  const calls = [
    variableDebtTokenBalanceOnEOA, // 0
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
    operationName: getAaveMigrateEOAV3OperationDefinition(network).name,
  }
}
