import {
  AaveLikeProtocolData,
  SharedAaveLikeProtocolDataArgs,
} from '@dma-library/protocols/aave-like/types'
import {
  determineReserveEModeCategory,
  fetchAssetPrice,
  fetchReserveData,
  fetchUserReserveData,
  getAaveLikeSystemContracts,
} from '@dma-library/protocols/aave-like/utils'
import BigNumber from 'bignumber.js'

export type SparkProtocolData = AaveLikeProtocolData

export type GetSparkProtocolData = (
  args: SharedAaveLikeProtocolDataArgs,
) => Promise<SparkProtocolData>

export const getSparkProtocolData: GetSparkProtocolData = async args => {
  const {
    addresses,
    provider,
    flashloanTokenAddress,
    proxy,
    debtTokenAddress,
    collateralTokenAddress,
  } = args
  const { oracle, poolDataProvider, pool } = await getAaveLikeSystemContracts(
    addresses,
    provider,
    'Spark',
  )

  const data = await Promise.all([
    fetchAssetPrice(oracle, flashloanTokenAddress),
    fetchAssetPrice(oracle, debtTokenAddress),
    fetchAssetPrice(oracle, collateralTokenAddress),
    fetchReserveData(poolDataProvider, flashloanTokenAddress),
    fetchReserveData(poolDataProvider, collateralTokenAddress),
    proxy ? fetchUserReserveData(poolDataProvider, debtTokenAddress, proxy) : undefined,
    proxy ? fetchUserReserveData(poolDataProvider, collateralTokenAddress, proxy) : undefined,
    poolDataProvider.getReserveEModeCategory(collateralTokenAddress),
    poolDataProvider.getReserveEModeCategory(debtTokenAddress),
  ])
  const [
    flashloanPrice,
    debtPrice,
    collateralPrice,
    flashloanReserveData,
    collateralReserveData,
    userDebtData,
    userCollateralData,
    collateralEModeCategory,
    debtEModeCategory,
  ] = data

  const collateralEModeCategoryAsNumber = new BigNumber(
    (await collateralEModeCategory).toString(),
  ).toNumber()
  const debtEModeCategoryAsNumber = new BigNumber((await debtEModeCategory).toString()).toNumber()
  const reserveEModeCategory = determineReserveEModeCategory(
    collateralEModeCategoryAsNumber,
    debtEModeCategoryAsNumber,
  )

  let eModeCategoryData
  if (pool && reserveEModeCategory !== 0) {
    eModeCategoryData = await pool.getEModeCategoryData(reserveEModeCategory)
  }

  return {
    flashloanAssetPriceInEth: flashloanPrice,
    debtTokenPriceInEth: debtPrice,
    collateralTokenPriceInEth: collateralPrice,
    reserveDataForFlashloan: flashloanReserveData,
    reserveDataForCollateral: collateralReserveData,
    reserveEModeCategory: reserveEModeCategory,
    userReserveDataForDebtToken: userDebtData,
    userReserveDataForCollateral: userCollateralData,
    eModeCategoryData: eModeCategoryData,
  }
}
