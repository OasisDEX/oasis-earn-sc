// V2 ABIs
import { Address } from '@deploy-configurations/types/address'
// V3 ABIs
// V3 L2 ABIs
import { amountFromWei } from '@dma-common/utils/common'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { Protocol } from '@dma-library/types'
import { AaveVersion } from '@dma-library/types/aave'
import {
  AllowedContractNames,
  getAbiForContract,
} from '@dma-library/utils/abis/get-abi-for-contract'
import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

type InternalAaveProtocolData = {
  collateralTokenAddress: string
  debtTokenAddress: string
  addresses: AaveLikeStrategyAddresses
  provider: providers.Provider
  flashloanTokenAddress?: string
  proxy?: string
}

export type AaveProtocolDataArgs =
  | (InternalAaveProtocolData & { protocolVersion: AaveVersion.v2 })
  | (InternalAaveProtocolData & { protocolVersion: AaveVersion.v3 })

export const getAaveProtocolData = async (args: AaveProtocolDataArgs) => {
  if (
    AaveCommon.isV2<
      AaveProtocolDataArgs,
      InternalAaveProtocolData & { protocolVersion: AaveVersion.v2 }
    >(args)
  ) {
    return getAaveV2ProtocolData(args)
  }
  if (AaveCommon.isV3(args)) {
    return getAaveV3ProtocolData(args)
  }

  throw new Error('Invalid Aave version')
}

type PriceResult = BigNumber | undefined
type ReserveDataResult = any

async function getAaveV2ProtocolData({
  addresses,
  provider,
  debtTokenAddress,
  collateralTokenAddress,
  flashloanTokenAddress,
  proxy,
}: InternalAaveProtocolData & { protocolVersion: AaveVersion.v2 }) {
  const oracle = await getContract(addresses.oracle, 'oracle', provider, 'AAVE')
  const poolDataProvider = await getContract(
    addresses.poolDataProvider,
    'poolDataProvider',
    provider,
    'AAVE',
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

async function getAaveV3ProtocolData({
  addresses,
  provider,
  debtTokenAddress,
  collateralTokenAddress,
  flashloanTokenAddress,
  proxy,
}: InternalAaveProtocolData & { protocolVersion: AaveVersion.v3 }) {
  const oracle = await getContract(addresses.oracle, 'oracle', provider, 'AAVE_V3')
  const poolDataProvider = await getContract(
    addresses.poolDataProvider,
    'poolDataProvider',
    provider,
    'AAVE_V3',
  )
  const pool = await getContract(addresses.lendingPool, 'pool', provider, 'AAVE_V3')

  const hasProxy = !!proxy

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
    hasProxy ? fetchUserReserveData(poolDataProvider, debtTokenAddress, proxy) : undefined,
    hasProxy ? fetchUserReserveData(poolDataProvider, collateralTokenAddress, proxy) : undefined,
    poolDataProvider.getReserveEModeCategory(collateralTokenAddress),
    poolDataProvider.getReserveEModeCategory(debtTokenAddress),
  ])

  const reserveEModeCategory = await determineReserveEModeCategory(
    [collateralEModeCategory, debtEModeCategory],
    hasProxy,
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
async function determineReserveEModeCategory(
  collateralEModeCategoryResult: any,
  debtEModeCategoryResult: any,
): Promise<number | undefined> {
  const collateralEModeCategory = Number(collateralEModeCategoryResult.toString())
  const debtEModeCategory = Number(debtEModeCategoryResult.toString())

  if (collateralEModeCategory === debtEModeCategory) {
    return collateralEModeCategory
  }
  return 0
}

async function getContract(
  address: Address,
  contractName: AllowedContractNames,
  provider: any,
  protocol: Protocol,
) {
  const abi = await getAbiForContract(contractName, provider, protocol)
  return new ethers.Contract(address, abi, provider)
}

async function fetchAssetPrice(priceOracle: any, tokenAddress?: string): Promise<PriceResult> {
  if (!tokenAddress) return undefined
  const amount: ethers.BigNumberish = await priceOracle.getAssetPrice(tokenAddress)
  return amountFromWei(new BigNumber(amount.toString()))
}

async function fetchReserveData(
  dataProvider: any,
  tokenAddress?: string,
): Promise<ReserveDataResult> {
  if (!tokenAddress) return undefined
  return dataProvider.getReserveConfigurationData(tokenAddress)
}

async function fetchUserReserveData(
  dataProvider: any,
  tokenAddress: string,
  proxy: string,
): Promise<ReserveDataResult> {
  return dataProvider.getUserReserveData(tokenAddress, proxy)
}

export type AaveProtocolData = ReturnType<typeof getAaveProtocolData>
