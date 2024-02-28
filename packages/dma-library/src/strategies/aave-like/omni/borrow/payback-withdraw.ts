import { aaveLike } from '@dma-library/strategies/aave-like'
import {
  AaveLikePaybackWithdrawArgsOmni,
  AaveLikePaybackWithdrawDependenciesOmni,
} from '@dma-library/strategies/aave-like/borrow/payback-withdraw'
import {
  validateAmountExceedsCap,
  validateYieldLoopCloseToLiquidation,
  validateYieldLoopSafeFromLiquidation,
} from '@dma-library/strategies/aave-like/omni/validation'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'

export const paybackWithdrawOmni = async (
  args: AaveLikePaybackWithdrawArgsOmni,
  dependencies: AaveLikePaybackWithdrawDependenciesOmni,
): Promise<SummerStrategy<AaveLikePositionV2>> => {
  const strategy = await aaveLike.borrow.paybackWithdraw(args, dependencies)

  const isPayingBackEth = args.debtToken.symbol.toUpperCase() === 'ETH'
  const targetPosition = args.position
    .withdraw(strategy.simulation.delta.collateral.shiftedBy(-args.collateralToken.precision!))
    .payback(strategy.simulation.delta.debt.shiftedBy(-args.debtToken.precision!))

  return {
    simulation: {
      swaps: [],
      errors: [...validateAmountExceedsCap(args.position, targetPosition)],
      warnings: [...validateYieldLoopCloseToLiquidation(args.position, targetPosition)],
      notices: [],
      successes: [...validateYieldLoopSafeFromLiquidation(args.position, targetPosition)],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.operationExecutor,
      data: encodeOperation(strategy.transaction, dependencies),
      value: isPayingBackEth ? args.amountDebtToPaybackInBaseUnit.toString() : '0',
    },
  }
}
