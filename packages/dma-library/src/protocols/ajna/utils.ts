import { ONE, ZERO } from '@dma-common/constants'
import { negativeToZero } from '@dma-common/utils/common'
import {
  ajnaCollateralizationFactor,
  ajnaPaybackAllWithdrawAllValueOffset,
} from '@dma-library/protocols/ajna/consts'
import { ajnaBuckets } from '@dma-library/strategies'
import { getAjnaEarnValidations } from '@dma-library/strategies/ajna/earn/validations'
import {
  getLiquidityInLupBucket,
  getPoolLiquidity,
  getTotalPoolLiquidity,
} from '@dma-library/strategies/ajna/validation/borrowish/notEnoughLiquidity'
import { AjnaPosition, CommonDMADependencies, SwapData } from '@dma-library/types'
import {
  AjnaCommonDependencies,
  AjnaEarnActions,
  AjnaEarnPayload,
  AjnaEarnPosition,
  AjnaError,
  AjnaNotice,
  AjnaPool,
  AjnaSuccess,
  AjnaWarning,
  SummerStrategy,
} from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export const prepareAjnaDMAPayload = <T extends { pool: AjnaPool }>({
  dependencies,
  targetPosition,
  errors,
  warnings,
  data,
  txValue,
  swaps,
}: {
  dependencies: CommonDMADependencies
  targetPosition: T
  errors: AjnaError[]
  warnings: AjnaWarning[]
  notices: AjnaNotice[]
  successes: AjnaSuccess[]
  data: string
  txValue: string
  swaps: (SwapData & { collectFeeFrom: 'sourceToken' | 'targetToken'; tokenFee: BigNumber })[]
}): SummerStrategy<T> => {
  return {
    simulation: {
      swaps,
      errors,
      warnings,
      notices: [],
      successes: [],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.operationExecutor,
      data,
      value: txValue,
    },
  }
}

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
}): SummerStrategy<T> => {
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

export const resolveTxValue = (isUsingEth: boolean, amount: BigNumber) =>
  isUsingEth ? ethers.utils.parseEther(amount.toString()).toString() : '0'

export const calculateAjnaApyPerDays = (amount: BigNumber, apy: BigNumber, days: number) =>
  amount
    // converted to numbers because BigNumber doesn't handle power with decimals
    .times(new BigNumber(Math.E ** apy.times(days).toNumber()))
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

function getMaxGenerateLup(
  pool: AjnaPool,
  positionDebt: BigNumber,
  positionCollateral: BigNumber,
  maxDebt: BigNumber = ZERO,
): { lup: BigNumber } {
  const initialMaxDebt = positionCollateral.times(pool.lowestUtilizedPrice).minus(positionDebt)

  const liquidityAvailableInLupBucket = getLiquidityInLupBucket(pool)

  if (initialMaxDebt.lte(liquidityAvailableInLupBucket)) {
    return {
      lup: pool.lowestUtilizedPrice,
    }
  }

  const sortedBuckets = [...pool.buckets].sort((a, b) => a.index.minus(b.index).toNumber())

  const lupBucketArrayIndex = sortedBuckets.findIndex(bucket =>
    bucket.index.isEqualTo(pool.lowestUtilizedPriceIndex),
  )

  const bucketBelowLup = sortedBuckets[lupBucketArrayIndex + 1]

  if (!bucketBelowLup) {
    return {
      lup: pool.lowestUtilizedPrice,
    }
  }

  const newPool = getSimulationPoolOutput(
    positionCollateral,
    positionDebt,
    liquidityAvailableInLupBucket,
    pool,
    bucketBelowLup.price,
    bucketBelowLup.index,
  )

  return getMaxGenerateLup(
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
  const { lup } = getMaxGenerateLup(pool, positionDebt, collateralAmount)

  const maxDebt = collateralAmount.times(lup).div(ajnaCollateralizationFactor).minus(positionDebt)

  // This fee calculated here acts like an offset from calculated maxDebt value. It's important
  // because this fee is added to user debt, and we need to take it into account when calculating max
  // generate
  const originationFee = getAjnaBorrowOriginationFee({
    interestRate: pool.interestRate,
    quoteAmount: maxDebt,
  })

  const poolLiquidity = getPoolLiquidity({
    buckets: pool.buckets,
    debt: pool.debt,
  })

  if (poolLiquidity.lte(maxDebt)) {
    const fee = getAjnaBorrowOriginationFee({
      interestRate: pool.interestRate,
      quoteAmount: poolLiquidity,
    })

    return negativeToZero(
      poolLiquidity.minus(fee).times(ONE.minus(ajnaPaybackAllWithdrawAllValueOffset)),
    )
  }

  return negativeToZero(maxDebt.minus(originationFee)).times(
    ONE.minus(ajnaPaybackAllWithdrawAllValueOffset),
  )
}

export function calculateNewLup(pool: AjnaPool, debtChange: BigNumber): [BigNumber, BigNumber] {
  if (pool.buckets.length === 0) {
    return [pool.lowestUtilizedPrice, pool.lowestUtilizedPriceIndex]
  }

  const sortedBuckets = [...pool.buckets].sort((a, b) => a.index.minus(b.index).toNumber())
  const totalPoolLiquidity = getTotalPoolLiquidity(pool.buckets)

  let remainingDebt = pool.debt.plus(debtChange)
  let newLup = sortedBuckets[0] ? sortedBuckets[0].price : pool.lowestUtilizedPrice
  let newLupIndex = sortedBuckets[0] ? sortedBuckets[0].index : pool.lowestUtilizedPriceIndex

  if (remainingDebt.gt(totalPoolLiquidity)) {
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

  const sortedBuckets = [...poolBuckets].sort((a, b) => a.index.minus(b.index).toNumber())

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

const resolveMaxLiquidityWithdraw = (availableToWithdraw: BigNumber, quoteTokenAmount: BigNumber) =>
  negativeToZero(availableToWithdraw.gte(quoteTokenAmount) ? quoteTokenAmount : availableToWithdraw)

export const calculateAjnaMaxLiquidityWithdraw = ({
  availableToWithdraw = ZERO,
  pool,
  position,
  poolCurrentLiquidity,
  simulation,
}: {
  availableToWithdraw?: BigNumber
  pool: AjnaPool
  poolCurrentLiquidity: BigNumber
  position: AjnaEarnPosition
  simulation?: AjnaEarnPosition
}) => {
  if (availableToWithdraw.gt(poolCurrentLiquidity)) {
    return position.quoteTokenAmount.gt(poolCurrentLiquidity)
      ? poolCurrentLiquidity
      : position.quoteTokenAmount
  }

  if (
    availableToWithdraw.gte(position.quoteTokenAmount) ||
    pool.lowestUtilizedPriceIndex.isZero() ||
    position.priceIndex?.gt(pool.lowestUtilizedPriceIndex)
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
      ].sort((a, b) => a.index.minus(b.index).toNumber()),
      depositSize: pool.depositSize.minus(liquidityInLupBucket),
      lowestUtilizedPriceIndex: buckets[lupBucketIndex + 1].index,
      lowestUtilizedPrice: buckets[lupBucketIndex + 1].price,
    },
    poolCurrentLiquidity,
    position,
    simulation,
  })
}

// it's for simulation purposes only, for current value use t0Np from borrowerInfo
export function getNeutralPrice(
  positionDebt: BigNumber,
  positionCollateral: BigNumber,
  interestRate: BigNumber,
  t0NeutralPrice: BigNumber,
  thresholdPrice: BigNumber,
  generatedDebt: boolean,
  withdrawnCollateral: boolean,
) {
  if (positionCollateral.isZero()) {
    return ZERO
  }

  const oldNpTpRatio = t0NeutralPrice.div(thresholdPrice.times(ajnaCollateralizationFactor))
  const oldInterestRate = oldNpTpRatio.times(2).minus(2).pow(2)

  const npToTpRatio = ONE.plus(interestRate.sqrt().div(2))

  const shouldRestamp = interestRate.lt(oldInterestRate)

  const resolvedNpToTpRatio =
    generatedDebt || withdrawnCollateral || shouldRestamp ? npToTpRatio : oldNpTpRatio

  return positionDebt
    .times(ajnaCollateralizationFactor)
    .div(positionCollateral)
    .times(resolvedNpToTpRatio)
}

export function getAjnaEarnDepositFee({
  interestRate,
  positionPrice,
  positionQuoteAmount,
  simulationPrice,
  simulationQuoteAmount,
}: {
  interestRate: BigNumber
  positionPrice: BigNumber
  positionQuoteAmount: BigNumber
  simulationPrice?: BigNumber
  simulationQuoteAmount?: BigNumber
}) {
  // current annualized rate divided by 365 * 3 (8 hours of interest)
  const depositFeeRate = interestRate.div(365 * 3)

  return simulationPrice?.lt(positionPrice) || simulationQuoteAmount?.gt(positionQuoteAmount)
    ? simulationQuoteAmount?.times(depositFeeRate)
    : undefined
}

export function shouldDisplayAjnaDustLimitValidation(position: AjnaPosition) {
  return (
    position.pool.loansCount.gt(10) &&
    position.debtAmount.lt(position.pool.poolMinDebtAmount) &&
    position.debtAmount.gt(0)
  )
}
