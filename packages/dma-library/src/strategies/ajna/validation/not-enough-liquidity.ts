import BigNumber from 'bignumber.js'

import { AjnaPosition } from '../../../types/ajna'
import { AjnaPool } from '../../../types/ajna/ajna-pool'
import { AjnaError } from '../../../types/common'

export function getPoolLiquidity(pool: AjnaPool): BigNumber {
  const liquidityAboveHtp = pool.buckets
    .filter(bucket => bucket.index.lt(pool.highestThresholdPriceIndex))
    .reduce((acc, bucket) => acc.plus(bucket.quoteTokens), new BigNumber(0))

  return liquidityAboveHtp.minus(pool.debt)
}

export function validateLiquidity(
  positionBefore: AjnaPosition,
  borrowAmount: BigNumber,
): AjnaError[] {
  const availableLiquidity = getPoolLiquidity(positionBefore.pool)
  if (availableLiquidity.lt(borrowAmount)) {
    return [
      {
        name: 'not-enough-liquidity',
        data: {
          amount: availableLiquidity.decimalPlaces(2).toString(),
        },
      },
    ]
  } else {
    return []
  }
}
