import { Address } from '@deploy-configurations/types/address'
import { Unbox } from '@dma-common/types/common'
import { AjnaSystem } from '@dma-contracts/test/fixtures'
import BigNumber from 'bignumber.js'

export function mapAjnaPoolDataTypes(
  poolAddress: Address,
  unmappedAjnaPool: Unbox<ReturnType<AjnaSystem['getPoolData']>>,
) {
  const pool = unmappedAjnaPool
  return {
    poolAddress,
    quoteToken: pool.quoteToken,
    collateralToken: pool.collateralToken,
    lup: new BigNumber(pool.lup.toString()),
    lowestUtilizedPrice: new BigNumber(pool.lowestUtilizedPrice.toString()),
    lowestUtilizedPriceIndex: new BigNumber(pool.lowestUtilizedPriceIndex.toString()),

    //@deprecated use highestThresholdPrice
    htp: new BigNumber(pool.htp.toString()),
    highestThresholdPrice: new BigNumber(pool.highestThresholdPrice.toString()),
    highestThresholdPriceIndex: new BigNumber(pool.highestThresholdPriceIndex.toString()),

    highestPriceBucket: new BigNumber(pool.highestPriceBucket.toString()),
    highestPriceBucketIndex: new BigNumber(pool.highestPriceBucketIndex.toString()),

    mostOptimisticMatchingPrice: new BigNumber(pool.mostOptimisticMatchingPrice.toString()),

    poolMinDebtAmount: new BigNumber(pool.poolMinDebtAmount.toString()),
    poolCollateralization: new BigNumber(pool.poolCollateralization.toString()),
    poolActualUtilization: new BigNumber(pool.poolActualUtilization.toString()),
    poolTargetUtilization: new BigNumber(pool.poolTargetUtilization.toString()),

    // annualized rate as a fraction 0.05 = 5%
    interestRate: new BigNumber(pool.interestRate.toString()),
    debt: new BigNumber(pool.debt.toString()),
    depositSize: new BigNumber(pool.depositSize.toString()),
    apr30dAverage: new BigNumber(pool.apr30dAverage.toString()),
    dailyPercentageRate30dAverage: new BigNumber(pool.dailyPercentageRate30dAverage.toString()),
    monthlyPercentageRate30dAverage: new BigNumber(pool.monthlyPercentageRate30dAverage.toString()),
    currentBurnEpoch: new BigNumber(pool.currentBurnEpoch.toString()),
    buckets: pool.buckets.map(bucket => ({
      price: new BigNumber(bucket.price.toString()),
      index: new BigNumber(bucket.index.toString()),
      quoteTokens: new BigNumber(bucket.quoteTokens.toString()),
      collateral: new BigNumber(bucket.collateral.toString()),
      bucketLPs: new BigNumber(bucket.bucketLPs.toString()),
    })),
    pendingInflator: new BigNumber(pool.pendingInflator.toString()),
  }
}
