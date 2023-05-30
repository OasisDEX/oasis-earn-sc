import poolAbi from '@abis/external/protocols/ajna/ajnaPoolERC20.json'
import { ZERO } from '@dma-common/constants'
import { negativeToZero } from '@dma-common/utils/common'
import { getAjnaEarnValidations } from '@dma-library/strategies/ajna/earn/validations'
import { getPoolLiquidity } from '@dma-library/strategies/ajna/validation/notEnoughLiquidity'
import {
  AjnaCommonDependencies,
  AjnaEarnActions,
  AjnaEarnPosition,
  AjnaError,
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
  data,
  txValue,
}: {
  dependencies: AjnaCommonDependencies
  targetPosition: T
  errors: AjnaError[]
  warnings: AjnaWarning[]
  data: string
  txValue: string
}): Strategy<T> => {
  return {
    simulation: {
      swaps: [],
      errors,
      warnings,
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
  const pool = new ethers.Contract(args.poolAddress, poolAbi, dependencies.provider)
  const [poolDebt] = await pool.debtInfo()

  const afterLupIndex =
    action === 'withdraw-earn'
      ? await pool.depositIndex(
          new BigNumber(poolDebt.toString()).plus(args.quoteAmount.shiftedBy(18)).toString(),
        )
      : undefined

  const { errors, warnings } = getAjnaEarnValidations({
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
