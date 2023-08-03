import { negativeToZero } from '@dma-common/utils/common'
import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { AjnaError, AjnaPosition } from '@dma-library/types/ajna'
import { AjnaPool, Bucket } from '@dma-library/types/ajna/ajna-pool'
import BigNumber from 'bignumber.js'

interface GetLiquidityInLupBucketParams {
  buckets: Bucket[]
  debt: BigNumber
}

export function getPoolLiquidity({ buckets, debt }: GetLiquidityInLupBucketParams): BigNumber {
  const liquidity = buckets.reduce((acc, bucket) => acc.plus(bucket.quoteTokens), new BigNumber(0))

  return liquidity.minus(debt)
}

export function getTotalPoolLiquidity(buckets: Bucket[]): BigNumber {
  return buckets.reduce((acc, bucket) => acc.plus(bucket.quoteTokens), new BigNumber(0))
}

export function getLiquidityInLupBucket(pool: AjnaPool): BigNumber {
  const liquidityAboveLup = pool.buckets
    .filter(bucket => bucket.index.lte(pool.lowestUtilizedPriceIndex))
    .reduce((acc, bucket) => acc.plus(bucket.quoteTokens), new BigNumber(0))

  return liquidityAboveLup.minus(pool.debt)
}

export function validateLiquidity(
  position: AjnaPosition,
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
