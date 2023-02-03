import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aaveV2PriceOracleABI from '../../../../../abi/external/aave/v2/priceOracle.json'
import aaveV2ProtocolDataProviderABI from '../../../../../abi/external/aave/v2/protocolDataProvider.json'
import aaveV3PriceOracleABI from '../../../../../abi/external/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '../../../../../abi/external/aave/v3/aaveProtocolDataProvider.json'
import aaveV3PoolABI from '../../../../../abi/external/aave/v3/pool.json'
import { amountFromWei } from '../../helpers'
import { ADDRESSES } from '../../helpers/addresses'
import { AAVEStrategyAddresses } from '../../operations/aave/v2'
import { AAVEV3StrategyAddresses } from '../../operations/aave/v3'
import { AaveVersion } from '../../strategies/aave/getCurrentPosition'
import { aaveV2UniqueContractName, aaveV3UniqueContractName } from './config'

type InternalAaveProtocolData<AaveAddresses> = {
  collateralTokenAddress: string
  debtTokenAddress: string
  proxy?: string
  addresses: AaveAddresses
  provider: providers.Provider
}

export type AaveProtocolDataArgs =
  | (InternalAaveProtocolData<AAVEStrategyAddresses> & { protocolVersion: AaveVersion.v2 })
  | (InternalAaveProtocolData<AAVEV3StrategyAddresses> & { protocolVersion: AaveVersion.v3 })

export const getAaveProtocolData = async ({
  collateralTokenAddress,
  debtTokenAddress,
  proxy,
  addresses,
  provider,
  protocolVersion,
}: AaveProtocolDataArgs) => {
  const isV2 = protocolVersion === AaveVersion.v2
  const isV3 = protocolVersion === AaveVersion.v3
  const hasProxy = !!proxy

  let priceOracle
  let aavePool
  if (isV2 && aaveV2UniqueContractName in addresses) {
    priceOracle = new ethers.Contract(addresses.priceOracle, aaveV2PriceOracleABI, provider)
  }
  if (isV3 && aaveV3UniqueContractName in addresses) {
    priceOracle = new ethers.Contract(addresses.aaveOracle, aaveV3PriceOracleABI, provider)
    aavePool = new ethers.Contract(addresses.pool, aaveV3PoolABI, provider)
  }

  let aaveProtocolDataProvider
  if (isV2 && aaveV2UniqueContractName in addresses) {
    aaveProtocolDataProvider = new ethers.Contract(
      addresses.protocolDataProvider,
      aaveV2ProtocolDataProviderABI,
      provider,
    )
  }
  if (isV3 && aaveV3UniqueContractName in addresses) {
    aaveProtocolDataProvider = new ethers.Contract(
      addresses.aaveProtocolDataProvider,
      aaveV3ProtocolDataProviderABI,
      provider,
    )
  }

  if (isV3 && !aavePool) {
    throw new Error('Aave pool not found')
  }

  if (!priceOracle || !aaveProtocolDataProvider) {
    throw new Error('Price oracle or protocol data provider not found')
  }

  const promises = [
    priceOracle
      .getAssetPrice(ADDRESSES.main.DAI)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    priceOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    priceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aaveProtocolDataProvider.getReserveConfigurationData(ADDRESSES.main.DAI),
    aaveProtocolDataProvider.getReserveConfigurationData(collateralTokenAddress),
  ]

  if (hasProxy) {
    promises.push(aaveProtocolDataProvider.getUserReserveData(debtTokenAddress, proxy))
    promises.push(aaveProtocolDataProvider.getUserReserveData(collateralTokenAddress, proxy))
  }

  if (isV3) {
    // TODO: Get reserveEModeCategory for debt token and compare
    promises.push(aaveProtocolDataProvider.getReserveEModeCategory(collateralTokenAddress))
    promises.push(aaveProtocolDataProvider.getReserveEModeCategory(debtTokenAddress))
  }

  const results = await Promise.all(promises)

  let reserveEModeCategory
  const doesNotHaveProxy = !hasProxy
  if (hasProxy && results[7] && results[8]) {
    const collateralEModeCategory = Number(results[7].toString())
    const debtEModeCategory = Number(results[8].toString())
    reserveEModeCategory =
      collateralEModeCategory === debtEModeCategory ? collateralEModeCategory : 0
  }
  if (doesNotHaveProxy && results[5] && results[6]) {
    const collateralEModeCategory = Number(results[5].toString())
    const debtEModeCategory = Number(results[6].toString())
    reserveEModeCategory =
      collateralEModeCategory === debtEModeCategory ? collateralEModeCategory : 0
  }

  let eModeCategoryData
  if (isV3 && aavePool && reserveEModeCategory !== 0) {
    eModeCategoryData = await aavePool.getEModeCategoryData(reserveEModeCategory)
  }

  const protocolData = {
    aaveFlashloanDaiPriceInEth: results[0] as BigNumber,
    aaveDebtTokenPriceInEth: results[1] as BigNumber,
    aaveCollateralTokenPriceInEth: results[2] as BigNumber,
    reserveDataForFlashloan: results[3],
    reserveDataForCollateral: results[4],
    reserveEModeCategory: reserveEModeCategory,
    userReserveDataForDebtToken: hasProxy ? results[5] : undefined,
    userReserveDataForCollateral: hasProxy ? results[6] : undefined,
    eModeCategoryData,
  }

  return protocolData
}

export type AaveProtocolData = ReturnType<typeof getAaveProtocolData>
