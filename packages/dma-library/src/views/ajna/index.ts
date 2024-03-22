import poolAbi from '@abis/external/protocols/ajna/ajnaPoolERC20.json'
import poolInfoAbi from '@abis/external/protocols/ajna/poolInfoUtils.json'
import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { normalizeValue } from '@dma-common/utils/common'
import { EarnCumulativesData, LendingCumulativesData } from '@dma-library/types'
import { AjnaEarnPosition, AjnaPosition } from '@dma-library/types/ajna'
import { AjnaPool } from '@dma-library/types/ajna/ajna-pool'
import { isCorrelatedPosition } from '@dma-library/utils/swap'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

interface Args {
  proxyAddress: Address
  poolAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
  collateralToken: string
  quoteToken: string
}

interface EarnData {
  lps: BigNumber
  priceIndex: BigNumber | null
  earnCumulativeFeesInQuoteToken: BigNumber
  earnCumulativeQuoteTokenDeposit: BigNumber
  earnCumulativeQuoteTokenWithdraw: BigNumber
}

export interface GetEarnData {
  (proxyAddress: Address, poolAddress: Address): Promise<EarnData>
}

export interface GetPoolData {
  (poolAddress: Address): Promise<AjnaPool>
}

export type AjnaCumulativesData = LendingCumulativesData & EarnCumulativesData

export interface GetCumulativesData<T> {
  (proxyAddress: Address, poolAddress: Address): Promise<T>
}

interface Dependencies {
  poolInfoAddress: Address
  provider: ethers.providers.Provider
  getPoolData: GetPoolData
  getCumulatives: GetCumulativesData<AjnaCumulativesData>
}

interface EarnDependencies {
  poolInfoAddress: Address
  provider: ethers.providers.Provider
  getEarnData: GetEarnData
  getPoolData: GetPoolData
}

const WAD = new BigNumber(10).pow(18)

export async function getPosition(
  { proxyAddress, poolAddress, collateralPrice, quotePrice, collateralToken, quoteToken }: Args,
  { poolInfoAddress, provider, getPoolData, getCumulatives }: Dependencies,
): Promise<AjnaPosition> {
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  const [pool, borrowerInfo, cumulatives] = await Promise.all([
    getPoolData(poolAddress),
    poolInfo.borrowerInfo(poolAddress, proxyAddress),
    getCumulatives(proxyAddress, poolAddress),
  ])

  const {
    borrowCumulativeWithdrawInCollateralToken,
    borrowCumulativeDepositInCollateralToken,
    borrowCumulativeFeesInCollateralToken,
    borrowCumulativeWithdrawInQuoteToken,
    borrowCumulativeDepositInQuoteToken,
    borrowCumulativeFeesInQuoteToken,
  } = cumulatives
  const collateralAmount = new BigNumber(borrowerInfo.collateral_.toString()).div(WAD)
  const debtAmount = new BigNumber(borrowerInfo.debt_.toString()).div(WAD)

  const netValue = collateralAmount.times(collateralPrice).minus(debtAmount.times(quotePrice))

  const isCorrelated = isCorrelatedPosition(collateralToken, quoteToken)

  let pnl

  if (isCorrelated) {
    pnl = {
      withFees: normalizeValue(
        borrowCumulativeWithdrawInQuoteToken
          .plus(netValue.div(quotePrice))
          .minus(borrowCumulativeDepositInQuoteToken)
          .minus(borrowCumulativeFeesInQuoteToken)
          .div(borrowCumulativeDepositInQuoteToken),
      ),
      withoutFees: normalizeValue(
        borrowCumulativeWithdrawInQuoteToken
          .plus(netValue.div(quotePrice))
          .minus(borrowCumulativeDepositInQuoteToken)
          .div(borrowCumulativeDepositInQuoteToken),
      ),
      cumulatives,
    }
  } else {
    pnl = {
      withFees: normalizeValue(
        borrowCumulativeWithdrawInCollateralToken
          .plus(netValue.div(collateralPrice))
          .minus(borrowCumulativeDepositInCollateralToken)
          .minus(borrowCumulativeFeesInCollateralToken)
          .div(borrowCumulativeDepositInCollateralToken),
      ),
      withoutFees: normalizeValue(
        borrowCumulativeWithdrawInCollateralToken
          .plus(netValue.div(collateralPrice))
          .minus(borrowCumulativeDepositInCollateralToken)
          .div(borrowCumulativeDepositInCollateralToken),
      ),
      cumulatives,
    }
  }

  return new AjnaPosition(
    pool,
    proxyAddress,
    collateralAmount,
    debtAmount,
    collateralPrice,
    quotePrice,
    new BigNumber(borrowerInfo.t0Np_.toString()).div(WAD),
    pnl,
  )
}

export async function getEarnPosition(
  { proxyAddress, poolAddress, quotePrice, collateralPrice }: Args,
  { poolInfoAddress, provider, getEarnData, getPoolData }: EarnDependencies,
): Promise<AjnaEarnPosition> {
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)
  const poolContract = new ethers.Contract(poolAddress, poolAbi, provider)

  const [pool, earnData] = await Promise.all([
    getPoolData(poolAddress),
    getEarnData(proxyAddress, poolAddress),
  ])
  const {
    lps,
    priceIndex,
    earnCumulativeFeesInQuoteToken,
    earnCumulativeQuoteTokenDeposit,
    earnCumulativeQuoteTokenWithdraw,
  } = earnData

  const quoteTokenAmount: BigNumber =
    lps.eq(ZERO) || priceIndex == null
      ? ZERO
      : await poolInfo
          .lpToQuoteTokens(poolAddress, lps.toString(), priceIndex?.toString())
          .then((quoteTokens: ethers.BigNumberish) => ethers.utils.formatUnits(quoteTokens, 18))
          .then((res: string) => new BigNumber(res))

  const poolDebtInfo: BigNumber = await poolContract
    .debtInfo()
    .then(([, , debt]: ethers.BigNumberish[]) => ethers.utils.formatUnits(debt, 18))
    .then((res: string) => new BigNumber(res))

  const frozenIndex: BigNumber = poolDebtInfo.isZero()
    ? undefined
    : await poolContract
        .depositIndex(poolDebtInfo.shiftedBy(18).toString())
        .then((index: ethers.BigNumberish) => ethers.utils.formatUnits(index, 0))
        .then((res: string) => new BigNumber(res))

  const isBucketFrozen = !!(frozenIndex && priceIndex && frozenIndex.eq(priceIndex))

  const collateralTokenAmount: BigNumber = lps.isZero()
    ? ZERO
    : await poolInfo
        .lpToCollateral(poolAddress, lps.toString(), priceIndex?.toString())
        .then((collateralTokens: ethers.BigNumberish) =>
          ethers.utils.formatUnits(collateralTokens, 18),
        )
        .then((res: string) => new BigNumber(res))

  const netValue = quoteTokenAmount.times(quotePrice)

  const pnl = {
    withFees: earnCumulativeQuoteTokenWithdraw
      .plus(quoteTokenAmount)
      .minus(earnCumulativeFeesInQuoteToken)
      .minus(earnCumulativeQuoteTokenDeposit)
      .div(earnCumulativeQuoteTokenDeposit),
    withoutFees: earnCumulativeQuoteTokenWithdraw
      .plus(quoteTokenAmount)
      .minus(earnCumulativeQuoteTokenDeposit)
      .div(earnCumulativeQuoteTokenDeposit),
  }
  const totalEarnings = {
    withFees: quoteTokenAmount.minus(
      earnCumulativeQuoteTokenDeposit
        .minus(earnCumulativeQuoteTokenWithdraw)
        .plus(earnCumulativeFeesInQuoteToken),
    ),
    withoutFees: quoteTokenAmount.minus(
      earnCumulativeQuoteTokenDeposit.minus(earnCumulativeQuoteTokenWithdraw),
    ),
  }

  return new AjnaEarnPosition(
    pool,
    proxyAddress,
    quoteTokenAmount,
    collateralTokenAmount,
    earnData.priceIndex,
    collateralPrice,
    quotePrice,
    netValue,
    pnl,
    totalEarnings,
    isBucketFrozen,
    {
      previousDayAverage: pool.lendApr,
      sevenDayAverage: pool.lendApr7dAverage,
      thirtyDayAverage: pool.lendApr30dAverage,
    },
  )
}
