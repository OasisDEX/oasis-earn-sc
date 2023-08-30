import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { PriceResult, ReserveDataResult } from '@dma-library/protocols/aave-like/types'
import {
  determineReserveEModeCategory,
  fetchAssetPrice,
  fetchReserveData,
  fetchUserReserveData,
  getAaveLikeSystemContracts,
} from '@dma-library/protocols/aave-like/utils'
import { providers } from 'ethers'

export type SparkProtocolDataArgs = {
  collateralTokenAddress: string
  debtTokenAddress: string
  addresses: AaveLikeStrategyAddresses
  provider: providers.Provider
  flashloanTokenAddress?: string
  proxy?: string
}

export type SparkProtocolData = {
  aaveFlashloanAssetPriceInEth: PriceResult
  aaveDebtTokenPriceInEth: PriceResult
  aaveCollateralTokenPriceInEth: PriceResult
  reserveDataForFlashloan: ReserveDataResult
  reserveDataForCollateral: ReserveDataResult
  reserveEModeCategory: number
  userReserveDataForDebtToken: any
  userReserveDataForCollateral: any
  eModeCategoryData: any
}

export type GetSparkProtocolData = (args: SparkProtocolDataArgs) => Promise<SparkProtocolData>

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
    aaveFlashloanAssetPriceInEth: flashloanPrice,
    aaveDebtTokenPriceInEth: debtPrice,
    aaveCollateralTokenPriceInEth: collateralPrice,
    reserveDataForFlashloan: flashloanReserveData,
    reserveDataForCollateral: collateralReserveData,
    reserveEModeCategory: reserveEModeCategory,
    userReserveDataForDebtToken: userDebtData,
    userReserveDataForCollateral: userCollateralData,
    eModeCategoryData: eModeCategoryData,
  }
}
