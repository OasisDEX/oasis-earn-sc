import { ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { BorrowArgs } from '../../operations/aave/borrow'
import { DepositArgs } from '../../operations/aave/deposit'
import {
  IBasePositionTransitionArgs,
  IOnlyDepositBorrowOpenPositionTransitionDependencies,
  ISimplePositionTransition,
  WithBorrowDebt,
  WithDepositCollateral,
} from '../types'
import { AAVETokens } from '../types/aave'
import { getAAVETokenAddresses } from './getAAVETokenAddresses'
import { getCurrentPosition } from './getCurrentPosition'

export async function simpleDepositBorrow(
  args: IBasePositionTransitionArgs<AAVETokens> & WithDepositCollateral & WithBorrowDebt,
  dependencies: IOnlyDepositBorrowOpenPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<ISimplePositionTransition> {
  const currentPosition = await getCurrentPosition(
    { ...args, proxy: dependencies.proxy },
    dependencies,
  )

  const { collateralTokenAddress, debtTokenAddress } = getAAVETokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const depositArgs: DepositArgs | undefined = args.amountCollateralToDepositInBaseUnit.gt(ZERO)
    ? {
        entryTokenAddress: collateralTokenAddress,
        entryTokenIsEth: args.collateralToken.symbol === 'ETH',
        amountInBaseUnit: args.amountCollateralToDepositInBaseUnit,
        depositToken: collateralTokenAddress,
        depositorAddress: dependencies.user,
        isSwapNeeded: false,
      }
    : undefined

  const borrowArgs: BorrowArgs | undefined = args.amountDebtToBorrowInBaseUnit.gt(ZERO)
    ? {
        borrowToken: debtTokenAddress,
        amountInBaseUnit: args.amountDebtToBorrowInBaseUnit,
        user: dependencies.user,
        isEthToken: args.debtToken.symbol === 'ETH',
        account: dependencies.proxy,
      }
    : undefined

  const operation = await operations.aave.depositBorrow(depositArgs, borrowArgs)

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
