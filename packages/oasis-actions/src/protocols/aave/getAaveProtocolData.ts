import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aaveV2PriceOracleABI from '../../../../../abi/external/aave/v2/priceOracle.json'
import aaveV2ProtocolDataProviderABI from '../../../../../abi/external/aave/v2/protocolDataProvider.json'
import aaveV3ProtocolDataProvider from '../../../../../abi/external/aave/v3/aaveProtocolDataProvider.json'
import aaveV3PoolABI from '../../../../../abi/external/aave/v3/pool.json'
import { amountFromWei } from '../../helpers'
import { ADDRESSES } from '../../helpers/addresses'
import { AaveVersion } from '../../strategies'

type InternalAaveProtocolData = {
  collateralTokenAddress: string
  debtTokenAddress: string
  proxy?: string
  // addresses: AaveAddresses
  // provider: providers.Provider
}

export type AaveProtocolDataArgs =
  | (InternalAaveProtocolData & { protocolVersion: AaveVersion.v2 })
  | (InternalAaveProtocolData & { protocolVersion: AaveVersion.v3 })

export const getAaveProtocolData = async (args: AaveProtocolDataArgs & { system: any }) => {
  if (isV2(args)) {
    return getAaveV2ProtocolData(args)
  } else if (isV3(args)) {
    return getAaveV3ProtocolData(args)
  } else {
    throw new Error('Invalid Aave version')
  }
}

function isV2(
  args: AaveProtocolDataArgs,
): args is InternalAaveProtocolData & { protocolVersion: AaveVersion.v2 } {
  return args.protocolVersion === AaveVersion.v2
}

function isV3(
  args: AaveProtocolDataArgs,
): args is InternalAaveProtocolData & {
  protocolVersion: AaveVersion.v3
} {
  return args.protocolVersion === AaveVersion.v3
}

async function getAaveV2ProtocolData({
  debtTokenAddress,
  collateralTokenAddress,
  proxy,
  system
}: InternalAaveProtocolData & { protocolVersion: AaveVersion.v2, system: any }) {
  const priceOracle = new ethers.Contract(system.config.aave.v2.PriceOracle, aaveV2PriceOracleABI, system.provider)
  const aaveProtocolDataProvider = new ethers.Contract(
    system.config.aave.v2.ProtocolDataProvider,
    aaveV2ProtocolDataProviderABI,
    system.provider,
  )

  const hasProxy = !!proxy

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

  const results = await Promise.all(promises)

  return {
    aaveFlashloanDaiPriceInEth: results[0] as BigNumber,
    aaveDebtTokenPriceInEth: results[1] as BigNumber,
    aaveCollateralTokenPriceInEth: results[2] as BigNumber,
    reserveDataForFlashloan: results[3],
    reserveDataForCollateral: results[4],
    reserveEModeCategory: undefined,
    userReserveDataForDebtToken: hasProxy ? results[5] : undefined,
    userReserveDataForCollateral: hasProxy ? results[6] : undefined,
    eModeCategoryData: undefined,
  }
}

async function getAaveV3ProtocolData({
  debtTokenAddress,
  collateralTokenAddress,
  proxy,
  system
}: InternalAaveProtocolData & { protocolVersion: AaveVersion.v3, system: any }) {
  const priceOracle = new ethers.Contract(system.config.aave.v3.AaveOracle, aaveV2PriceOracleABI, system.provider)
  const aaveProtocolDataProvider = new ethers.Contract(
    system.config.aave.v3.AaveProtocolDataProvider,
    aaveV3ProtocolDataProvider,
    system.provider,
  )
  const aavePool = new ethers.Contract(system.config.aave.v3.Pool, aaveV3PoolABI, system.provider)

  const hasProxy = !!proxy

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

  promises.push(aaveProtocolDataProvider.getReserveEModeCategory(collateralTokenAddress))
  promises.push(aaveProtocolDataProvider.getReserveEModeCategory(debtTokenAddress))

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
  if (aavePool && reserveEModeCategory !== 0) {
    eModeCategoryData = await aavePool.getEModeCategoryData(reserveEModeCategory)
  }

  return {
    aaveFlashloanDaiPriceInEth: results[0] as BigNumber,
    aaveDebtTokenPriceInEth: results[1] as BigNumber,
    aaveCollateralTokenPriceInEth: results[2] as BigNumber,
    reserveDataForFlashloan: results[3],
    reserveDataForCollateral: results[4],
    reserveEModeCategory: reserveEModeCategory,
    userReserveDataForDebtToken: hasProxy ? results[5] : undefined,
    userReserveDataForCollateral: hasProxy ? results[6] : undefined,
    eModeCategoryData: eModeCategoryData,
  }
}

export type AaveProtocolData = ReturnType<typeof getAaveProtocolData>
