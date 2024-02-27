import { aaveLike } from '@dma-library/strategies/aave-like'
import {
  AaveLikeOpenArgsOmni,
  AaveLikeOpenDependenciesOmni,
} from '@dma-library/strategies/aave-like/multiply/open'
import { AaveLikePositionV2, SummerStrategy } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'

export const openOmni = async (
  args: AaveLikeOpenArgsOmni,
  dependencies: AaveLikeOpenDependenciesOmni,
): Promise<SummerStrategy<AaveLikePositionV2>> => {
  const strategy = await aaveLike.multiply.open(args, dependencies)

  const isDepositingEth = args.entryToken?.symbol === 'ETH'

  const data = strategy.transaction

  const targetPosition = args.position
    .deposit(
      strategy.simulation.position.collateral.amount.shiftedBy(-args.collateralToken.precision!),
    )
    .borrow(strategy.simulation.position.debt.amount.shiftedBy(-args.debtToken.precision!))

  return {
    simulation: {
      // @ts-ignore
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
      data: encodeOperation(data, dependencies),
      value:
        isDepositingEth && args.collateralToken.symbol === args.entryToken?.symbol
          ? args.depositedByUser.collateralInWei.toString()
          : isDepositingEth && args.debtToken.symbol === args.entryToken?.symbol
          ? args.depositedByUser.debtInWei.toString()
          : '0',
    },
  }
}
