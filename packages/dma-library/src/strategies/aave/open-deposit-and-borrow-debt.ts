import { ZERO } from '@dma-common/constants'
import { operations } from '@dma-library/operations'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { BorrowArgs } from '@dma-library/operations/aave/v2/borrow'
import { DepositArgs } from '@dma-library/operations/aave/v2/deposit'
import {
  IBasePositionTransitionArgs,
  IOnlyDepositBorrowOpenPositionTransitionDependencies,
  ISimplePositionTransition,
  WithBorrowDebt,
  WithDepositCollateral,
  WithPositionType,
} from '@dma-library/types'
import { AAVETokens } from '@dma-library/types/aave'

import { getAaveTokenAddresses } from './get-aave-token-addresses'
import { AaveVersion, getCurrentPosition } from './get-current-position'

export async function openDepositAndBorrowDebt(
  args: IBasePositionTransitionArgs<AAVETokens> &
    WithDepositCollateral &
    WithBorrowDebt &
    WithPositionType,
  dependencies: IOnlyDepositBorrowOpenPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<ISimplePositionTransition> {
  const currentPosition = await getCurrentPosition(
    { ...args, proxy: dependencies.proxy },
    { ...dependencies, protocolVersion: AaveVersion.v2 },
  )

  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const depositArgs: DepositArgs = {
    entryTokenAddress: collateralTokenAddress,
    entryTokenIsEth: args.collateralToken.symbol === 'ETH',
    amountInBaseUnit: args.amountCollateralToDepositInBaseUnit,
    depositToken: collateralTokenAddress,
    depositorAddress: dependencies.user,
    isSwapNeeded: false,
  }

  const borrowArgs: BorrowArgs = {
    borrowToken: debtTokenAddress,
    amountInBaseUnit: args.amountDebtToBorrowInBaseUnit,
    user: dependencies.user,
    isEthToken: args.debtToken.symbol === 'ETH',
    account: dependencies.proxy,
  }

  const operation = await operations.aave.v2.openDepositAndBorrow(depositArgs, borrowArgs, {
    positionType: args.positionType,
    protocol: 'AAVE',
  })

  const finalPosition = currentPosition
    .deposit(args.amountCollateralToDepositInBaseUnit)
    .borrow(args.amountDebtToBorrowInBaseUnit)

  const debtDelta = currentPosition.debt.amount.plus(finalPosition.debt.amount)
  const collateralDelta = currentPosition.collateral.amount.minus(finalPosition.collateral.amount)
  const isIncreasingRisk = finalPosition.riskRatio.loanToValue.gt(
    currentPosition.riskRatio.loanToValue,
  )

  return {
    transaction: {
      ...operation,
    },
    simulation: {
      delta: {
        debt: debtDelta,
        collateral: collateralDelta,
        flashloanAmount: ZERO,
      },
      flags: {
        requiresFlashloan: false,
        isIncreasingRisk,
      },
      position: finalPosition,
    },
  }
}
