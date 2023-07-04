import { ONE, ZERO } from '@dma-common/constants'
import { negativeToZero, normalizeValue } from '@dma-common/utils/common'
import { ajnaBuckets } from '@dma-library/strategies'
import { getAjnaEarnValidations } from '@dma-library/strategies/ajna/earn/validations'
import {
  getLiquidityInLupBucket,
  getPoolLiquidity,
} from '@dma-library/strategies/ajna/validation/borrowish/notEnoughLiquidity'
import {
  AjnaCommonDependencies,
  AjnaEarnActions,
  AjnaEarnPosition,
  AjnaError,
  AjnaNotice,
  AjnaSuccess,
  AjnaWarning,
  Strategy,
} from '@dma-library/types/ajna'
import { AjnaEarnPayload } from '@dma-library/types/ajna/ajna-dependencies'
import { AjnaPool } from '@dma-library/types/ajna/ajna-pool'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export const prepareAjnaPayload = <T extends { pool: AjnaPool }>({
  dependencies,
  targetPosition,
  errors,
  warnings,
  notices,
  successes,
  data,
  txValue,
}: {
  dependencies: AjnaCommonDependencies
  targetPosition: T
  errors: AjnaError[]
  warnings: AjnaWarning[]
  notices: AjnaNotice[]
  successes: AjnaSuccess[]
  data: string
  txValue: string
}): Strategy<T> => {
  return {
    simulation: {
      swaps: [],
      errors,
      warnings,
      notices,
      successes,
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: txValue,
    },
  }
}

export const getAjnaEarnActionOutput = async ({
  targetPosition,
  data,
  dependencies,
  args,
  action,
  txValue,
}: {
  targetPosition: AjnaEarnPosition
  data: string
  dependencies: AjnaCommonDependencies
  args: AjnaEarnPayload
  action: AjnaEarnActions
  txValue: string
}) => {
  const afterLupIndex = ['deposit-earn', 'withdraw-earn'].includes(action)
    ? calculateNewLupWhenAdjusting(args.position.pool, args.position, targetPosition).newLupIndex
    : undefined

  const { errors, warnings, notices, successes } = getAjnaEarnValidations({
    price: args.price,
    quoteAmount: args.quoteAmount,
    quoteTokenPrecision: args.quoteTokenPrecision,
    position: args.position,
    simulation: targetPosition,
    afterLupIndex,
    action,
  })

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    errors,
    warnings,
    notices,
    successes,
    data,
    txValue,
  })
}

export const resolveAjnaEthAction = (isUsingEth: boolean, amount: BigNumber) =>
  isUsingEth ? ethers.utils.parseEther(amount.toString()).toString() : '0'

export const calculateAjnaApyPerDays = (amount: BigNumber, apy: BigNumber, days: number) =>
  // converted to numbers because BigNumber doesn't handle power with decimals
  amount
    .times(new BigNumber(Math.E ** apy.times(days).div(365).toNumber()))
    .minus(amount)
    .div(amount)

// The origination fee is calculated as the greatest of the current annualized
// borrower interest rate divided by 52 (one week of interest) or 5 bps multiplied by the loan’s new
// debt.
export const getAjnaBorrowOriginationFee = ({
  interestRate,
  quoteAmount,
}: {
  interestRate: BigNumber
  quoteAmount: BigNumber
}) => {
  const weeklyInterestRate = interestRate.div(52)
  const fiveBasisPoints = new BigNumber(0.0005)

  return BigNumber.max(weeklyInterestRate, fiveBasisPoints).times(quoteAmount)
}

function getSimulationPoolOutput(
  positionCollateral: BigNumber,
  positionDebt: BigNumber,
  debtChange: BigNumber,
  pool: AjnaPool,
  newLup: BigNumber,
  newLupIndex: BigNumber,
) {
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

function getMaxGenerate(
  pool: AjnaPool,
  positionDebt: BigNumber,
  positionCollateral: BigNumber,
  maxDebt: BigNumber = ZERO,
): BigNumber {
  const { lowestUtilizedPrice, highestThresholdPrice } = pool

  if (lowestUtilizedPrice.lt(highestThresholdPrice)) {
    return maxDebt
  }

  const initialMaxDebt = positionCollateral.times(pool.lowestUtilizedPrice).minus(positionDebt)

  const bucketsAboveLup = pool.buckets
    .filter(bucket => bucket.index.lte(pool.lowestUtilizedPriceIndex))
    .sort((a, b) => a.index.minus(b.index).toNumber())

  const liquidityAvailableInLupBucket = bucketsAboveLup
    .reduce((acc, curr) => acc.plus(curr.quoteTokens), ZERO)
    .minus(pool.debt)

  if (initialMaxDebt.lte(liquidityAvailableInLupBucket)) {
    return initialMaxDebt.plus(maxDebt)
  }

  const sortedBuckets = pool.buckets
    .filter(bucket => bucket.index.lte(pool.highestThresholdPriceIndex))
    .sort((a, b) => a.index.minus(b.index).toNumber())

  const lupBucketArrayIndex = sortedBuckets.findIndex(bucket =>
    bucket.index.isEqualTo(pool.lowestUtilizedPriceIndex),
  )

  const bucketBelowLup = sortedBuckets[lupBucketArrayIndex + 1]

  if (!bucketBelowLup) {
    return maxDebt.plus(liquidityAvailableInLupBucket)
  }

  const newPool = getSimulationPoolOutput(
    positionCollateral,
    positionDebt,
    liquidityAvailableInLupBucket,
    pool,
    bucketBelowLup.price,
    bucketBelowLup.index,
  )

  return getMaxGenerate(
    newPool,
    positionDebt.plus(liquidityAvailableInLupBucket),
    positionCollateral,
    liquidityAvailableInLupBucket.plus(maxDebt),
  )
}

export function calculateMaxGenerate(
  pool: AjnaPool,
  positionDebt: BigNumber,
  collateralAmount: BigNumber,
) {
  const maxDebtWithoutFee = getMaxGenerate(pool, positionDebt, collateralAmount)

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

export function calculateNewLupWhenAdjusting(
  pool: AjnaPool,
  position: AjnaEarnPosition,
  simulation?: AjnaEarnPosition,
) {
  if (!simulation) {
    return {
      newLupPrice: pool.lowestUtilizedPrice,
      newLupIndex: pool.lowestUtilizedPriceIndex,
    }
  }

  let newLupPrice = ZERO
  let newLupIndex = ZERO

  const oldBucket = pool.buckets.find(bucket => bucket.price.eq(position.price))

  if (!oldBucket) {
    return {
      newLupPrice,
      newLupIndex,
    }
  }

  const poolBuckets = [...pool.buckets].filter(bucket => !bucket.index.eq(oldBucket.index))

  poolBuckets.push({
    ...oldBucket,
    quoteTokens: oldBucket.quoteTokens.minus(position.quoteTokenAmount),
  })

  const newBucketIndex = new BigNumber(
    ajnaBuckets.findIndex(bucket => new BigNumber(bucket).eq(simulation.price.shiftedBy(18))),
  )

  const existingBucketArrayIndex = poolBuckets.findIndex(bucket => bucket.index.eq(newBucketIndex))

  if (existingBucketArrayIndex !== -1) {
    poolBuckets[existingBucketArrayIndex].quoteTokens = poolBuckets[
      existingBucketArrayIndex
    ].quoteTokens.plus(simulation.quoteTokenAmount)
  } else {
    poolBuckets.push({
      price: simulation.price,
      index: newBucketIndex,
      quoteTokens: simulation.quoteTokenAmount,
      bucketLPs: ZERO,
      collateral: ZERO,
    })
  }

  const sortedBuckets = poolBuckets.sort((a, b) => a.index.minus(b.index).toNumber())

  let remainingDebt = pool.debt

  for (let i = 0; i < sortedBuckets.length; i++) {
    const bucket = sortedBuckets[i]

    if (remainingDebt.gt(bucket.quoteTokens)) {
      remainingDebt = remainingDebt.minus(bucket.quoteTokens)
    } else {
      newLupPrice = bucket.price
      newLupIndex = bucket.index
      break
    }
  }

  return {
    newLupPrice,
    newLupIndex,
  }
}

export function simulatePool(
  pool: AjnaPool,
  debtChange: BigNumber,
  positionDebt: BigNumber,
  positionCollateral: BigNumber,
): AjnaPool {
  const [newLup, newLupIndex] = calculateNewLup(pool, debtChange)

  return getSimulationPoolOutput(
    positionCollateral,
    positionDebt,
    debtChange,
    pool,
    newLup,
    newLupIndex,
  )
}

export const getAjnaLiquidationPrice = ({
  pool,
  debtAmount,
  collateralAmount,
}: {
  pool: AjnaPool
  debtAmount: BigNumber
  collateralAmount: BigNumber
}) =>
  normalizeValue(
    pool.mostOptimisticMatchingPrice
      .times(
        debtAmount
          .times(pool.pendingInflator)
          .div(pool.lowestUtilizedPrice.times(collateralAmount)),
      )
      .times(ONE.plus(pool.interestRate)),
  )

const resolveMaxLiquidityWithdraw = (availableToWithdraw: BigNumber, quoteTokenAmount: BigNumber) =>
  availableToWithdraw.gte(quoteTokenAmount) ? quoteTokenAmount : availableToWithdraw

export const calculateAjnaMaxLiquidityWithdraw = ({
  availableToWithdraw = ZERO,
  pool,
  position,
  simulation,
}: {
  availableToWithdraw?: BigNumber
  pool: AjnaPool
  position: AjnaEarnPosition
  simulation?: AjnaEarnPosition
}) => {
  if (
    availableToWithdraw.gte(position.quoteTokenAmount) ||
    pool.lowestUtilizedPriceIndex.isZero()
  ) {
    return position.quoteTokenAmount
  }

  const { newLupIndex } = calculateNewLupWhenAdjusting(pool, position, simulation)

  if (newLupIndex.gt(pool.highestThresholdPriceIndex)) {
    return resolveMaxLiquidityWithdraw(availableToWithdraw, position.quoteTokenAmount)
  }

  const buckets = pool.buckets.filter(bucket => bucket.index.lte(pool.highestThresholdPriceIndex))

  const lupBucket = buckets.find(bucket => bucket.index.eq(pool.lowestUtilizedPriceIndex))
  const lupBucketIndex = buckets.findIndex(bucket => bucket.index.eq(pool.lowestUtilizedPriceIndex))

  if (!lupBucket) {
    return resolveMaxLiquidityWithdraw(availableToWithdraw, position.quoteTokenAmount)
  }

  const liquidityInLupBucket = getLiquidityInLupBucket(pool)

  if (!buckets[lupBucketIndex + 1]) {
    return resolveMaxLiquidityWithdraw(
      availableToWithdraw.plus(liquidityInLupBucket),
      position.quoteTokenAmount,
    )
  }

  return calculateAjnaMaxLiquidityWithdraw({
    availableToWithdraw: availableToWithdraw.plus(liquidityInLupBucket),
    pool: {
      ...pool,
      buckets: [
        ...buckets.filter(bucket => !bucket.index.eq(lupBucket.index)),
        { ...lupBucket, quoteTokens: lupBucket.quoteTokens.minus(liquidityInLupBucket) },
      ],
      lowestUtilizedPriceIndex: buckets[lupBucketIndex + 1].index,
      lowestUtilizedPrice: buckets[lupBucketIndex + 1].price,
    },
    position,
    simulation,
  })
}
