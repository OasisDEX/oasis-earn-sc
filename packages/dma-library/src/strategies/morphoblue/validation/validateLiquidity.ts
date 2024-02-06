import { AjnaError, MorphoBluePosition } from '@dma-library/types'
import { BigNumber } from 'bignumber.js'

export function validateLiquidity(
  position: MorphoBluePosition,
  targetPosition: MorphoBluePosition,
  borrowAmount: BigNumber,
): AjnaError[] {
  const liquidity = position.market.totalSupplyAssets.minus(position.market.totalBorrowAssets)
  const isIncreasingRisk = position.riskRatio.loanToValue.lte(targetPosition.riskRatio.loanToValue)

  if (liquidity.lt(borrowAmount) && isIncreasingRisk) {
    return [
      {
        name: 'not-enough-liquidity',
        data: {
          amount: liquidity.toString(),
        },
      },
    ]
  }

  return []
}
