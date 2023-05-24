import poolInfoAbi from '@abis/external/protocols/ajna/poolInfoUtils.json'
import rewardsManagerAbi from '@abis/external/protocols/ajna/rewardsManager.json'
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
          .lpToQuoteTokens(poolAddress, earnData.lps.toString(), earnData.priceIndex?.toString())
          .then((quoteTokens: ethers.BigNumberish) => ethers.utils.formatUnits(quoteTokens, 18))
          .then((res: string) => new BigNumber(res))

  // We assume that there won't be a mix of quote tokens and collateral tokens to withdraw at the same time
  // hence we convert all lps to collateral and when bucket won't contain any quoteTokens but only collateral
  // we can utilize this value to show how much user will be able to withdraw
  // (it's basically needed for case when there were some liquidations of borrow positions in lender bucket)
  const collateralTokenAmount: BigNumber =
    !earnData.lps.isZero() && quoteTokenAmount.isZero()
      ? await poolInfo
          .lpToCollateral(poolAddress, earnData.lps.toString(), earnData.priceIndex?.toString())
          .then((quoteTokens: ethers.BigNumberish) => ethers.utils.formatUnits(quoteTokens, 18))
          .then((res: string) => new BigNumber(res))
      : ZERO

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
    collateralTokenAmount,
    earnData.priceIndex,
    earnData.nftID,
    collateralPrice,
    quotePrice,
    rewards,
  )
}

export const getAjnaBuyingPower = ({
  collateralAmount,
  collateralPrice,
  debtAmount,
  quotePrice,
  maxRiskRatio,
}: AjnaPosition) =>
  collateralAmount
    .times(collateralPrice)
    .times(maxRiskRatio.loanToValue)
    .minus(debtAmount.times(quotePrice))
