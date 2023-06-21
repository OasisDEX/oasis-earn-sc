import { negativeToZero } from '@dma-common/utils/common'
import { formatCryptoBalance } from '@dma-common/utils/common/formaters'
import { AjnaError, AjnaPosition } from '@dma-library/types/ajna'
import { AjnaPool } from '@dma-library/types/ajna/ajna-pool'
import BigNumber from 'bignumber.js'

export function getPoolLiquidity(pool: AjnaPool): BigNumber {
  const liquidityAboveHtp = pool.buckets
    .filter(bucket => bucket.index.lte(pool.highestThresholdPriceIndex))
    .reduce((acc, bucket) => acc.plus(bucket.quoteTokens), new BigNumber(0))

  return liquidityAboveHtp.minus(pool.debt)
}

export function validateLiquidity(
  positionBefore: AjnaPosition,
  position: AjnaPosition,
  borrowAmount: BigNumber,
): AjnaError[] {
  const availableLiquidity = getPoolLiquidity(positionBefore.pool)
  const maxDebt = positionBefore.debtAvailable(position.collateralAmount)

  if (availableLiquidity.lt(borrowAmount)) {
    return [
      {
        name: 'not-enough-liquidity',
        data: {
          amount: formatCryptoBalance(negativeToZero(maxDebt)),
        },
      },
    ]
  } else {
    return []
  }
}
