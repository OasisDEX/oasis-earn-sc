import { MAX_UINT, ZERO } from '@dma-common/constants'
import { resolveAaveLikeBorrowOperations } from '@dma-library/operations/aave-like'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/common'
import { IOperation, PositionType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import {
  AaveLikePaybackWithdraw,
  AaveLikePaybackWithdrawArgs,
  AaveLikePaybackWithdrawDependencies,
} from './types'

export const paybackWithdraw: AaveLikePaybackWithdraw = async (args, dependencies) => {
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
  args: AaveLikePaybackWithdrawArgs,
  dependencies: AaveLikePaybackWithdrawDependencies,
): Promise<IOperation> {
  const positionType: PositionType = 'Borrow'
  const currentPosition = dependencies.currentPosition
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
    addresses: dependencies.addresses,
    network: dependencies.network,
  }

  const aaveLikeBorrowOperations = resolveAaveLikeBorrowOperations(
    dependencies.protocolType,
    positionType,
  )

  return aaveLikeBorrowOperations.paybackWithdraw(sharedArgs)
}
