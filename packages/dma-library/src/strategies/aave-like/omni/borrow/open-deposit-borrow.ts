import { aaveLike } from '@dma-library/strategies/aave-like'
import {
  AaveLikeOpenDepositBorrowArgsOmni,
  AaveLikeOpenDepositBorrowDependenciesOmni,
} from '@dma-library/strategies/aave-like/borrow/open-deposit-borrow'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'

export const openDepositBorrowOmni = async (
  args: AaveLikeOpenDepositBorrowArgsOmni,
  dependencies: AaveLikeOpenDepositBorrowDependenciesOmni,
): Promise<SummerStrategy<AaveLikePositionV2>> => {
  const strategy = await aaveLike.borrow.openDepositBorrow(args, dependencies)

  const isDepositingEth = args.collateralToken.symbol === 'ETH'

  const targetPosition = args.position
    .deposit(strategy.simulation.delta.collateral.shiftedBy(-args.collateralToken.precision!))
    .borrow(strategy.simulation.delta.debt.shiftedBy(-args.debtToken.precision!))

  return {
    simulation: {
      swaps: [],
      errors: [],
      warnings: [],
      notices: [],
      successes: [],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.operationExecutor,
      data: encodeOperation(strategy.transaction, dependencies),
      value: isDepositingEth ? args.amountCollateralToDepositInBaseUnit.toString() : '0',
    },
  }
}
