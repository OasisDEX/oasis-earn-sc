import { MAX_UINT, ZERO } from '@dma-common/constants'
import { operations } from '@dma-library/operations'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AaveVersion } from '@dma-library/strategies'
import { IOperation, WithPaybackDebt, WithWithdrawCollateral } from '@dma-library/types'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import { IStrategy } from '@dma-library/types/position-transition'
import {
  WithAaveTransitionArgs,
  WithAaveV2StrategyDependencies,
  WithAaveV3StrategyDependencies,
} from '@dma-library/types/strategy-params'
import BigNumber from 'bignumber.js'

import { getAaveTokenAddresses } from '../get-aave-token-addresses'

export type AavePaybackWithdrawArgs = WithAaveTransitionArgs &
  WithWithdrawCollateral &
  WithPaybackDebt

type AavePaybackWithdrawDependencies =
  | (WithAaveV2StrategyDependencies & WithV2Protocol)
  | (WithAaveV3StrategyDependencies & WithV3Protocol)

export async function paybackWithdraw(
  args: AavePaybackWithdrawArgs,
  dependencies: AavePaybackWithdrawDependencies,
): Promise<IStrategy> {
  const currentPosition = dependencies.currentPosition

  const operation = await buildOperation(args, dependencies)

  const finalPosition = currentPosition
    .payback(args.amountDebtToPaybackInBaseUnit)
    .withdraw(args.amountCollateralToWithdrawInBaseUnit)

  return {
    transaction: operation,
    simulation: {
      delta: {
        debt: currentPosition.debt.amount.plus(args.amountDebtToPaybackInBaseUnit),
        collateral: currentPosition.collateral.amount.minus(
          args.amountCollateralToWithdrawInBaseUnit,
        ),
        flashloanAmount: ZERO,
      },
      position: finalPosition,
    },
  }
}

async function buildOperation(
  args: AavePaybackWithdrawArgs,
  dependencies: AavePaybackWithdrawDependencies,
): Promise<IOperation> {
  const currentPosition = dependencies.currentPosition
  const protocolVersion = dependencies.protocol.version

  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const sharedArgs = {
    amountCollateralToWithdrawInBaseUnit: currentPosition.collateral.amount.lte(
      args.amountCollateralToWithdrawInBaseUnit,
    )
      ? new BigNumber(MAX_UINT)
      : args.amountCollateralToWithdrawInBaseUnit,
    amountDebtToPaybackInBaseUnit: args.amountDebtToPaybackInBaseUnit,
    isPaybackAll: args.amountDebtToPaybackInBaseUnit.gte(currentPosition.debt.amount),
    collateralTokenAddress: collateralTokenAddress,
    debtTokenAddress: debtTokenAddress,
    collateralIsEth: currentPosition.collateral.symbol === 'ETH',
    debtTokenIsEth: currentPosition.debt.symbol === 'ETH',
    proxy: dependencies.proxy,
    user: dependencies.user,
  }

  const paybackWithdrawOperation = {
    [AaveVersion.v3]: operations.aave.v3.paybackWithdraw,
    [AaveVersion.v2]: operations.aave.v2.paybackWithdraw,
  }

  if (paybackWithdrawOperation[protocolVersion]) {
    return await operations.aave.v3.paybackWithdraw({
      ...sharedArgs,
      addresses: dependencies.addresses as AAVEV3StrategyAddresses,
    })
  }
  if (paybackWithdrawOperation[protocolVersion]) {
    return await operations.aave.v2.paybackWithdraw({
      ...sharedArgs,
      addresses: dependencies.addresses as AAVEStrategyAddresses,
    })
  }

  throw new Error('Invalid protocol version')
}
