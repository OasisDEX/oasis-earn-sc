import { AjnaError, MorphoBluePosition } from '@dma-library/types'
import { BigNumber } from 'bignumber.js'

export function validateLiquidity(
  position: MorphoBluePosition,
  borrowAmount: BigNumber,
): AjnaError[] {
  if (position.market.totalSupplyAssets.minus(position.market.totalBorrowAssets).lt(borrowAmount)) {
    return [
      {
        name: 'not-enough-liquidity',
        data: {
          amount: borrowAmount.toString(),
        },
      },
    ]
  }

  return []
}
