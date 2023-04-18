import { AjnaEarnPosition, AjnaPosition } from '@dma-library/types/ajna'
import { AjnaPool } from '@dma-library/types/ajna/ajna-pool'
import poolERC20Abi from '@oasisdex/abis/external/protocols/ajna/ajnaPoolERC20.json'
import poolInfoAbi from '@oasisdex/abis/external/protocols/ajna/poolInfoUtils.json'
import { ZERO } from '@oasisdex/dma-common/constants'
import { Address } from '@oasisdex/dma-common/types/address'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

interface Args {
  proxyAddress: Address
  poolAddress: Address
}

interface EarnData {
  lps: BigNumber
  priceIndex: BigNumber | null
  nftID: string | null
}

export interface GetEarnData {
  (proxyAddress: Address): Promise<EarnData>
}

interface Dependencies {
  poolInfoAddress: Address
  provider: ethers.providers.Provider
}

interface EarnDependencies {
  poolInfoAddress: Address
  provider: ethers.providers.Provider
  getEarnData: GetEarnData
}

const WAD = new BigNumber(10).pow(18)

export async function getPool(
  poolAddress: string,
  poolInfoAddress: string,
  provider: ethers.providers.Provider,
): Promise<AjnaPool> {
  const pool = new ethers.Contract(poolAddress, poolERC20Abi, provider)
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  const [
    collateralAddress,
    quoteTokenAddress,
    interestRateInfo,
    poolPricesInfo,
    momp,
    poolUtilizationInfo,
  ] = await Promise.all([
    pool.collateralAddress(),
    pool.quoteTokenAddress(),
    pool.interestRateInfo(),
    poolInfo.poolPricesInfo(poolAddress),
    poolInfo.momp(poolAddress).catch(() => ethers.BigNumber.from(0)),
    poolInfo.poolUtilizationInfo(poolAddress),
  ])

  return {
    collateralToken: collateralAddress,
    quoteToken: quoteTokenAddress,
    poolAddress: poolAddress,
    lup: new BigNumber(poolPricesInfo.lup_.toString()).div(WAD),

    lowestUtilizedPrice: new BigNumber(poolPricesInfo.lup_.toString()).div(WAD),
    lowestUtilizedPriceIndex: new BigNumber(poolPricesInfo.lupIndex_.toString()),

    highestPriceBucket: new BigNumber(poolPricesInfo.hpb_.toString()).div(WAD),
    highestPriceBucketIndex: new BigNumber(poolPricesInfo.hpbIndex_.toString()),

    htp: new BigNumber(poolPricesInfo.htp_.toString()).div(WAD),
    highestThresholdPrice: new BigNumber(poolPricesInfo.htp_.toString()).div(WAD),
    highestThresholdPriceIndex: new BigNumber(poolPricesInfo.htpIndex_.toString()),

    mostOptimisticMatchingPrice: new BigNumber(momp.toString()).div(WAD),

    poolMinDebtAmount: new BigNumber(poolUtilizationInfo.poolMinDebtAmount_.toString()),
    poolCollateralization: new BigNumber(poolUtilizationInfo.poolCollateralization_.toString()),
    poolActualUtilization: new BigNumber(poolUtilizationInfo.poolActualUtilization_.toString()),
    poolTargetUtilization: new BigNumber(poolUtilizationInfo.poolTargetUtilization_.toString()),

    rate: new BigNumber(interestRateInfo[0].toString()).div(WAD),
  }
}

export async function getPosition(
  { proxyAddress, poolAddress }: Args,
  { poolInfoAddress, provider }: Dependencies,
): Promise<AjnaPosition> {
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  const [pool, borrowerInfo] = await Promise.all([
    getPool(poolAddress, poolInfoAddress, provider),
    poolInfo.borrowerInfo(poolAddress, proxyAddress),
  ])

  return new AjnaPosition(
    pool,
    proxyAddress,
    new BigNumber(borrowerInfo.collateral_.toString()).div(WAD),
    new BigNumber(borrowerInfo.debt_.toString()).div(WAD),
  )
}

export async function getEarnPosition(
  { proxyAddress, poolAddress }: Args,
  { poolInfoAddress, provider, getEarnData }: EarnDependencies,
): Promise<AjnaEarnPosition> {
  const poolInfo = new ethers.Contract(poolInfoAddress, poolInfoAbi, provider)

  const [pool, earnData] = await Promise.all([
    getPool(poolAddress, poolInfoAddress, provider),
    getEarnData(proxyAddress),
  ])

  const quoteTokenAmount: BigNumber =
    earnData.lps.eq(ZERO) || earnData.priceIndex == null
      ? ZERO
      : await poolInfo
          .lpsToQuoteTokens(poolAddress, earnData.lps.toString(), earnData.priceIndex?.toString())
          .then((quoteTokens: ethers.BigNumberish) => ethers.utils.formatUnits(quoteTokens, 18))
          .then((res: string) => new BigNumber(res))

  return new AjnaEarnPosition(pool, proxyAddress, quoteTokenAmount, earnData.priceIndex)
}
