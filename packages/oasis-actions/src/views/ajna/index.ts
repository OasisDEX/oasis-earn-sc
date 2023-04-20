import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import poolInfoAbi from '../../../src/abi/external/ajna/poolInfoUtils.json'
import rewardsManagerAbi from '../../../src/abi/external/ajna/rewardsManager.json'
import { getAjnaBorrowOriginationFee } from '../../helpers/ajna'
import { ZERO } from '../../helpers/constants'
import { negativeToZero } from '../../helpers/negativeToZero'
import { getPoolLiquidity } from '../../strategies/ajna/validation/notEnoughLiquidity'
import { AjnaEarnPosition, AjnaPosition } from '../../types/ajna'
import { AjnaPool } from '../../types/ajna/AjnaPool'
import { Address } from '../../types/common'

interface Args {
  proxyAddress: Address
  poolAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
}

interface EarnData {
  lps: BigNumber
  priceIndex: BigNumber | null
  nftID: string | null
}

export interface GetEarnData {
  (proxyAddress: Address): Promise<EarnData>
}

export interface GetPoolData {
  (poolAddress: Address): Promise<AjnaPool>
}

interface Dependencies {
  poolInfoAddress: Address
  provider: ethers.providers.Provider
  getPoolData: GetPoolData
}

interface EarnDependencies {
  poolInfoAddress: Address
  rewardsManagerAddress: Address
  provider: ethers.providers.Provider
  getEarnData: GetEarnData
  getPoolData: GetPoolData
}

const WAD = new BigNumber(10).pow(18)

export async function getPosition(
  { proxyAddress, poolAddress, collateralPrice, quotePrice }: Args,
  { poolInfoAddress, provider, getPoolData }: Dependencies,
): Promise<AjnaPosition> {
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  const [pool, borrowerInfo] = await Promise.all([
    getPoolData(poolAddress),
    poolInfo.borrowerInfo(poolAddress, proxyAddress),
  ])

  return new AjnaPosition(
    pool,
    proxyAddress,
    new BigNumber(borrowerInfo.collateral_.toString()).div(WAD),
    new BigNumber(borrowerInfo.debt_.toString()).div(WAD),
    collateralPrice,
    quotePrice,
  )
}

export type GetPosition = typeof getPosition

export async function getEarnPosition(
  { proxyAddress, poolAddress, quotePrice, collateralPrice }: Args,
  { poolInfoAddress, rewardsManagerAddress, provider, getEarnData, getPoolData }: EarnDependencies,
): Promise<AjnaEarnPosition> {
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)
  const rewardsManager = new ethers.Contract(rewardsManagerAddress, rewardsManagerAbi, provider)

  const [pool, earnData] = await Promise.all([getPoolData(poolAddress), getEarnData(proxyAddress)])

  const quoteTokenAmount: BigNumber =
    earnData.lps.eq(ZERO) || earnData.priceIndex == null
      ? ZERO
      : await poolInfo
          .lpsToQuoteTokens(poolAddress, earnData.lps.toString(), earnData.priceIndex?.toString())
          .then((quoteTokens: ethers.BigNumberish) => ethers.utils.formatUnits(quoteTokens, 18))
          .then((res: string) => new BigNumber(res))

  const rewards: BigNumber = earnData.nftID
    ? await rewardsManager
        .calculateRewards(earnData.nftID, pool.currentBurnEpoch.toString())
        .then((reward: ethers.BigNumberish) => ethers.utils.formatUnits(reward, 18))
        .then((res: ethers.BigNumberish) => new BigNumber(res.toString()))
    : ZERO

  return new AjnaEarnPosition(
    pool,
    proxyAddress,
    quoteTokenAmount,
    earnData.priceIndex,
    earnData.nftID,
    collateralPrice,
    quotePrice,
    rewards,
  )
}

export function calculateNewLup(pool: AjnaPool, debtChange: BigNumber): [BigNumber, BigNumber] {
  const sortedBuckets = pool.buckets
    .filter(bucket => bucket.index.lte(pool.highestThresholdPriceIndex))
    .sort((a, b) => a.index.minus(b.index).toNumber())
  const availablePoolLiquidity = getPoolLiquidity(pool)

  let remainingDebt = pool.debt.plus(debtChange)
  let newLup = sortedBuckets[0] ? sortedBuckets[0].price : pool.lowestUtilizedPrice
  let newLupIndex = sortedBuckets[0] ? sortedBuckets[0].index : pool.lowestUtilizedPriceIndex

  if (remainingDebt.gt(availablePoolLiquidity)) {
    newLup = sortedBuckets[sortedBuckets.length - 1].price
    newLupIndex = sortedBuckets[sortedBuckets.length - 1].index
    remainingDebt = ZERO

    return [newLup, newLupIndex]
  }

  sortedBuckets.forEach(bucket => {
    if (remainingDebt.gt(bucket.quoteTokens)) {
      remainingDebt = remainingDebt.minus(bucket.quoteTokens)
    } else {
      if (remainingDebt.gt(0)) {
        newLup = bucket.price
        newLupIndex = bucket.index
        remainingDebt = ZERO
      }
    }
  })

  return [newLup, newLupIndex]
}

export function simulatePool(
  pool: AjnaPool,
  debtChange: BigNumber,
  positionDebt: BigNumber,
  positionCollateral: BigNumber,
): AjnaPool {
  const [newLup, newLupIndex] = calculateNewLup(pool, debtChange)
  const thresholdPrice = !positionCollateral.eq(0)
    ? positionDebt.dividedBy(positionCollateral)
    : ZERO

  const newHtp = thresholdPrice.gt(pool.htp) ? thresholdPrice : pool.htp

  return {
    ...pool,
    lup: newLup,
    lowestUtilizedPrice: newLup,
    lowestUtilizedPriceIndex: newLupIndex,
    htp: newHtp,
    highestThresholdPrice: newHtp,
    // TODO this is old index, we need to map newHtp to index
    highestThresholdPriceIndex: pool.highestThresholdPriceIndex,

    debt: pool.debt.plus(debtChange),
  }
}

export function calculateMaxGenerate(
  pool: AjnaPool,
  positionDebt: BigNumber,
  collateralAmount: BigNumber,
) {
  const initialMaxDebt = collateralAmount.times(pool.lowestUtilizedPrice).minus(positionDebt)

  const [newLup] = calculateNewLup(pool, initialMaxDebt)
  const maxDebtWithoutFee = collateralAmount.times(newLup).minus(positionDebt)
  const originationFee = getAjnaBorrowOriginationFee({
    interestRate: pool.interestRate,
    quoteAmount: maxDebtWithoutFee,
  })

  const poolLiquidity = getPoolLiquidity(pool)
  const poolLiquidityWithFee = poolLiquidity.minus(originationFee)
  const maxDebtWithFee = maxDebtWithoutFee.minus(originationFee)

  if (poolLiquidityWithFee.lt(maxDebtWithFee)) {
    return negativeToZero(poolLiquidityWithFee)
  }

  return negativeToZero(maxDebtWithFee)
}
