import { Address } from '@deploy-configurations/types/address'
import BigNumber from 'bignumber.js'

export interface Bucket {
  price: BigNumber
  index: BigNumber
  quoteTokens: BigNumber
  collateral: BigNumber
  bucketLPs: BigNumber
}

export interface AjnaPool {
  poolAddress: Address
  quoteToken: Address
  collateralToken: Address

  //@deprecated use lowestUtilizedPrice
  lup: BigNumber
  lowestUtilizedPrice: BigNumber
  lowestUtilizedPriceIndex: BigNumber

  //@deprecated use highestThresholdPrice
  htp: BigNumber
  highestThresholdPrice: BigNumber
  highestThresholdPriceIndex: BigNumber

  highestPriceBucket: BigNumber
  highestPriceBucketIndex: BigNumber

  mostOptimisticMatchingPrice: BigNumber

  poolMinDebtAmount: BigNumber
  poolCollateralization: BigNumber
  poolActualUtilization: BigNumber
  poolTargetUtilization: BigNumber

  // annualized rate as a fraction 0.05 = 5%
  interestRate: BigNumber
  debt: BigNumber
  depositSize: BigNumber
  apr30dAverage: BigNumber
  dailyPercentageRate30dAverage: BigNumber
  monthlyPercentageRate30dAverage: BigNumber
  currentBurnEpoch: BigNumber
  buckets: Bucket[]
}
