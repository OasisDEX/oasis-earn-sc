import BigNumber from 'bignumber.js'

import { formatCryptoBalance } from '../../../helpers/formatCryptoBalance'
import { negativeToZero } from '../../../helpers/negativeToZero'
import { AjnaPosition } from '../../../types/ajna'
import { AjnaPool } from '../../../types/ajna/AjnaPool'
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
          amount: formatCryptoBalance(negativeToZero(availableLiquidity)),
        },
      },
    ]
  } else {
    return []
  }
}
