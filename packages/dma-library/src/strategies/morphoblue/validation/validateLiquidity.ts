import { AjnaError, MorphoBluePosition } from '@dma-library/types'
import { BigNumber } from 'bignumber.js'

export function validateLiquidity(
  position: MorphoBluePosition,
  borrowAmount: BigNumber,
): AjnaError[] {
  const liquidity = position.market.totalSupplyAssets.minus(position.market.totalBorrowAssets)

  if (liquidity.lt(borrowAmount)) {
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
