import { aaveLike } from '@dma-library/strategies/aave-like'
import {
  AaveLikeCloseArgsOmni,
  AaveLikeCloseDependenciesOmni,
} from '@dma-library/strategies/aave-like/multiply/close/types'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'

export const closeOmni = async (
  args: AaveLikeCloseArgsOmni,
  dependencies: AaveLikeCloseDependenciesOmni,
): Promise<SummerStrategy<AaveLikePositionV2>> => {
  const strategy = await aaveLike.multiply.close(args, dependencies)

  const targetPosition = args.position
    .withdraw(
      strategy.simulation.delta.collateral.shiftedBy(-args.collateralToken.precision!).negated(),
    )
    .payback(strategy.simulation.delta.debt.shiftedBy(-args.debtToken.precision!).negated())

  return {
    simulation: {
      swaps: [strategy.simulation.swap],
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
      value: '0',
    },
  }
}
