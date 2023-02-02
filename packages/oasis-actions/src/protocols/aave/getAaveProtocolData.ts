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

export type AaveProtocolDataArgs = {
  collateralTokenAddress: string
  debtTokenAddress: string
  proxy?: string
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses
  provider: providers.Provider
  protocolVersion: 2 | 3
}

export const getAaveProtocolData = async ({
  collateralTokenAddress,
  debtTokenAddress,
  proxy,
  addresses,
  provider,
  protocolVersion,
}: AaveProtocolDataArgs) => {
  const isV2 = protocolVersion === 2
  const isV3 = protocolVersion === 3
  const hasProxy = !!proxy

  let priceOracle
  let aavePool
  if (isV2 && 'priceOracle' in addresses) {
    priceOracle = new ethers.Contract(addresses.priceOracle, aaveV2PriceOracleABI, provider)
  }
  if (isV3 && 'aaveOracle' in addresses) {
    priceOracle = new ethers.Contract(addresses.aaveOracle, aaveV3PriceOracleABI, provider)
    aavePool = new ethers.Contract(addresses.pool, aaveV3PoolABI, provider)
  }

  let aaveProtocolDataProvider
  if (isV2 && 'protocolDataProvider' in addresses) {
    aaveProtocolDataProvider = new ethers.Contract(
      addresses.protocolDataProvider,
      aaveV2ProtocolDataProviderABI,
      provider,
    )
  }
  if (isV3 && 'aaveProtocolDataProvider' in addresses) {
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

  if (isV3) {
    promises.push(aaveProtocolDataProvider.getReserveEModeCategory(collateralTokenAddress))
  }

  if (hasProxy) {
    promises.push(aaveProtocolDataProvider.getUserReserveData(debtTokenAddress, proxy))
    promises.push(aaveProtocolDataProvider.getUserReserveData(collateralTokenAddress, proxy))
  }

  const results = await Promise.all(promises)

  const reserveEModeCategory = isV3 && results[5] ? Number(results[5].toString()) : undefined

  let eModeCategoryData
  if (isV3 && aavePool && reserveEModeCategory !== 0) {
    eModeCategoryData = await aavePool.getEModeCategoryData(reserveEModeCategory)
  }

  return {
    aaveFlashloanDaiPriceInEth: results[0] as BigNumber,
    aaveDebtTokenPriceInEth: results[1] as BigNumber,
    aaveCollateralTokenPriceInEth: results[2] as BigNumber,
    reserveDataForFlashloan: results[3],
    reserveDataForCollateral: results[4],
    reserveEModeCategory: reserveEModeCategory,
    userReserveDataForDebtToken: hasProxy ? results[6] : undefined,
    userReserveDataForCollateral: hasProxy ? results[7] : undefined,
    eModeCategoryData,
  }
}

export type AaveProtocolData = ReturnType<typeof getAaveProtocolData>
