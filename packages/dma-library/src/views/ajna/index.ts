import poolInfoAbi from '@abis/external/protocols/ajna/poolInfoUtils.json'
import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { AjnaEarnPosition, AjnaPosition } from '@dma-library/types/ajna'
import { AjnaPool } from '@dma-library/types/ajna/ajna-pool'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

interface Args {
  proxyAddress: Address
  poolAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
}

interface EarnData {
  lps: BigNumber
  priceIndex: BigNumber | null
  earnCumulativeFeesInQuoteToken: BigNumber
  earnCumulativeQuoteTokenDeposit: BigNumber
  earnCumulativeQuoteTokenWithdraw: BigNumber
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
    new BigNumber(borrowerInfo.t0Np_.toString()).div(WAD),
  )
}

export type GetPosition = typeof getPosition

export async function getEarnPosition(
  { proxyAddress, poolAddress, quotePrice, collateralPrice }: Args,
  { poolInfoAddress, provider, getEarnData, getPoolData }: EarnDependencies,
): Promise<AjnaEarnPosition> {
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  const [pool, earnData] = await Promise.all([getPoolData(poolAddress), getEarnData(proxyAddress)])
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
  )
}
