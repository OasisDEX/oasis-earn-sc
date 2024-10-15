import {
  AaveLikeProtocolData,
  SharedAaveLikeProtocolDataArgs,
} from '@dma-library/protocols/aave-like/types'
import {
  fetchAssetPrice,
  fetchReserveData,
  fetchUserReserveData,
  getAaveLikeSystemContracts,
} from '@dma-library/protocols/aave-like/utils'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { AaveVersion } from '@dma-library/types/aave'

export type AaveV2ProtocolDataArgs = SharedAaveLikeProtocolDataArgs & {
  protocolVersion: AaveVersion.v2
}
export type AaveV3ProtocolDataArgs = SharedAaveLikeProtocolDataArgs & {
  protocolVersion: AaveVersion.v3
}
export type AaveProtocolDataArgs = AaveV2ProtocolDataArgs | AaveV3ProtocolDataArgs

export type AaveProtocolData = AaveLikeProtocolData

export type GetAaveProtocolData = (args: AaveProtocolDataArgs) => Promise<AaveProtocolData>

export const getAaveProtocolData: GetAaveProtocolData = async args => {
  if (
    AaveCommon.isV2<
      AaveProtocolDataArgs,
      SharedAaveLikeProtocolDataArgs & { protocolVersion: AaveVersion.v2 }
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
    flashloanAssetPriceInEth: flashloanPrice,
    debtTokenPriceInEth: debtPrice,
    collateralTokenPriceInEth: collateralPrice,
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
}: SharedAaveLikeProtocolDataArgs & { protocolVersion: AaveVersion.v3 }) {
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
  ] = await Promise.all([
    fetchAssetPrice(oracle, flashloanTokenAddress),
    fetchAssetPrice(oracle, debtTokenAddress),
    fetchAssetPrice(oracle, collateralTokenAddress),
    fetchReserveData(poolDataProvider, flashloanTokenAddress),
    fetchReserveData(poolDataProvider, collateralTokenAddress),
    proxy ? fetchUserReserveData(poolDataProvider, debtTokenAddress, proxy) : undefined,
    proxy ? fetchUserReserveData(poolDataProvider, collateralTokenAddress, proxy) : undefined,
  ])
  const allTokensSymbols = Object.keys(addresses.tokens)
  const collateralTokenSymbol = allTokensSymbols.find(tokenSymbol => {
    return addresses.tokens[tokenSymbol]?.toLowerCase() === collateralTokenAddress.toLowerCase()
  })
  const debtTokenSymbol = allTokensSymbols.find(tokenSymbol => {
    return addresses.tokens[tokenSymbol]?.toLowerCase() === debtTokenAddress.toLowerCase()
  })
  const isCollateralEthCorrelated = collateralTokenSymbol?.toUpperCase().includes('ETH') || false
  const isDebtEthCorrelated = debtTokenSymbol?.toUpperCase().includes('ETH') || false
  const reserveEModeCategory = isCollateralEthCorrelated || isDebtEthCorrelated ? 1 : 0

  let eModeCategoryData
  if (pool && reserveEModeCategory !== 0) {
    eModeCategoryData = await pool.getEModeCategoryCollateralConfig(reserveEModeCategory)
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
