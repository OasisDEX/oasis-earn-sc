import { amountFromWei } from '@dma-common/utils/common'
import { AjnaError, MorphoBluePosition } from '@dma-library/types'
import { BigNumber } from 'bignumber.js'

export function validateLiquidity(
  position: MorphoBluePosition,
  borrowAmount: BigNumber,
  quotePrecision: number,
): AjnaError[] {
  const totalSupplyAssets = amountFromWei(position.market.totalSupplyAssets, quotePrecision)
  const totalBorrowAssets = amountFromWei(position.market.totalBorrowAssets, quotePrecision)

  if (totalSupplyAssets.minus(totalBorrowAssets).lt(borrowAmount)) {
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
