import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { PriceResult, ReserveDataResult } from '@dma-library/protocols/aave-like/types'
import {
  determineReserveEModeCategory,
  fetchAssetPrice,
  fetchReserveData,
  fetchUserReserveData,
  getAaveLikeSystemContracts,
} from '@dma-library/protocols/aave-like/utils'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { AaveVersion } from '@dma-library/types/aave'
import { providers } from 'ethers'

type SharedAaveProtocolDataArgs = {
  collateralTokenAddress: string
  debtTokenAddress: string
  addresses: AaveLikeStrategyAddresses
  provider: providers.Provider
  flashloanTokenAddress?: string
  proxy?: string
}

export type AaveV2ProtocolDataArgs = SharedAaveProtocolDataArgs & {
  protocolVersion: AaveVersion.v2
}
export type AaveV3ProtocolDataArgs = SharedAaveProtocolDataArgs & {
  protocolVersion: AaveVersion.v3
}
export type AaveProtocolDataArgs = AaveV2ProtocolDataArgs | AaveV3ProtocolDataArgs

export type AaveProtocolData = {
  aaveFlashloanAssetPriceInEth: PriceResult
  aaveDebtTokenPriceInEth: PriceResult
  aaveCollateralTokenPriceInEth: PriceResult
  reserveDataForFlashloan: ReserveDataResult
  reserveDataForCollateral: ReserveDataResult
  reserveEModeCategory: number | undefined
  userReserveDataForDebtToken: any
  userReserveDataForCollateral: any
  eModeCategoryData: any | undefined
}

export type GetAaveProtocolData = (args: AaveProtocolDataArgs) => Promise<AaveProtocolData>

export const getAaveProtocolData: GetAaveProtocolData = async args => {
  if (
    AaveCommon.isV2<
      AaveProtocolDataArgs,
      SharedAaveProtocolDataArgs & { protocolVersion: AaveVersion.v2 }
    >(args)
  ) {
    return getAaveV2ProtocolData(args)
  }
  if (AaveCommon.isV3(args)) {
    return getAaveV3ProtocolData(args)
  }

  throw new Error('Invalid Aave version')
}

export async function getAaveV2ProtocolData({
  addresses,
  provider,
  debtTokenAddress,
  collateralTokenAddress,
  flashloanTokenAddress,
  proxy,
}: AaveV2ProtocolDataArgs) {
  const { oracle, poolDataProvider } = await getAaveLikeSystemContracts(addresses, provider, 'AAVE')

  const [
    flashloanPrice,
    debtPrice,
    collateralPrice,
    flashloanReserveData,
    collateralReserveData,
    userDebtData,
    userCollateralData,
  ] = await Promise.all([
    fetchAssetPrice(oracle, flashloanTokenAddress),
    fetchAssetPrice(oracle, debtTokenAddress),
    fetchAssetPrice(oracle, collateralTokenAddress),
    fetchReserveData(poolDataProvider, flashloanTokenAddress),
    fetchReserveData(poolDataProvider, collateralTokenAddress),
    proxy ? fetchUserReserveData(poolDataProvider, debtTokenAddress, proxy) : undefined,
    proxy ? fetchUserReserveData(poolDataProvider, collateralTokenAddress, proxy) : undefined,
  ])

  return {
    aaveFlashloanAssetPriceInEth: flashloanPrice,
    aaveDebtTokenPriceInEth: debtPrice,
    aaveCollateralTokenPriceInEth: collateralPrice,
    reserveDataForFlashloan: flashloanReserveData,
    reserveDataForCollateral: collateralReserveData,
    reserveEModeCategory: undefined,
    userReserveDataForDebtToken: userDebtData,
    userReserveDataForCollateral: userCollateralData,
    eModeCategoryData: undefined,
  }
}

export async function getAaveV3ProtocolData({
  addresses,
  provider,
  debtTokenAddress,
  collateralTokenAddress,
  flashloanTokenAddress,
  proxy,
}: SharedAaveProtocolDataArgs & { protocolVersion: AaveVersion.v3 }) {
  const { oracle, poolDataProvider, pool } = await getAaveLikeSystemContracts(
    addresses,
    provider,
    'AAVE_V3',
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
