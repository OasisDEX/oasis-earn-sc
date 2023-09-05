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
  ] = await Promise.all([
    fetchAssetPrice(oracle, flashloanTokenAddress),
    fetchAssetPrice(oracle, debtTokenAddress),
    fetchAssetPrice(oracle, collateralTokenAddress),
    fetchReserveData(poolDataProvider, flashloanTokenAddress),
    fetchReserveData(poolDataProvider, collateralTokenAddress),
    proxy ? fetchUserReserveData(poolDataProvider, debtTokenAddress, proxy) : undefined,
    proxy ? fetchUserReserveData(poolDataProvider, collateralTokenAddress, proxy) : undefined,
    Number(poolDataProvider.getReserveEModeCategory(collateralTokenAddress).toString()),
    Number(poolDataProvider.getReserveEModeCategory(debtTokenAddress).toString()),
  ])

  const reserveEModeCategory = determineReserveEModeCategory(
    collateralEModeCategory,
    debtEModeCategory,
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
