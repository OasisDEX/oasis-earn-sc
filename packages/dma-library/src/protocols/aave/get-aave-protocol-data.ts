// V2 ABIs
import aaveV2PriceOracleABI from '@oasisdex/abis/external/protocols/aave/v2/priceOracle.json'
import aaveV2ProtocolDataProviderABI from '@oasisdex/abis/external/protocols/aave/v2/protocolDataProvider.json'
// V3 ABIs
import aaveV3PriceOracleABI from '@oasisdex/abis/external/protocols/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '@oasisdex/abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import aaveV3PoolABI from '@oasisdex/abis/external/protocols/aave/v3/pool.json'
// V3 L2 ABIs
import aaveV3PriceOracleOptimismABI from '@oasisdex/abis/external/protocols/aave/v3-l2/aaveOracle.json'
import aaveV3ProtocolDataProviderOptimismABI from '@oasisdex/abis/external/protocols/aave/v3-l2/aaveProtocolDataProvider.json'
import aaveV3PoolOptimismABI from '@oasisdex/abis/external/protocols/aave/v3-l2/pool.json'
import { amountFromWei } from '@oasisdex/dma-common/utils/common'
import { getForkedNetwork as coalesceNetwork } from '@oasisdex/dma-common/utils/network'
import { Network } from '@oasisdex/dma-deployments/types/network'
import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import { AAVEStrategyAddresses } from '../../operations/aave/v2'
import { AAVEV3StrategyAddresses } from '../../operations/aave/v3'
import { AaveVersion } from '../../strategies'

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

export const getAaveProtocolData = async (args: AaveProtocolDataArgs) => {
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
): args is InternalAaveProtocolData<AAVEStrategyAddresses> & { protocolVersion: AaveVersion.v2 } {
  return args.protocolVersion === AaveVersion.v2
}

function isV3(
  args: AaveProtocolDataArgs,
): args is InternalAaveProtocolData<AAVEV3StrategyAddresses> & {
  protocolVersion: AaveVersion.v3
} {
  return args.protocolVersion === AaveVersion.v3
}

async function getAaveV2ProtocolData({
  addresses,
  provider,
  debtTokenAddress,
  collateralTokenAddress,
  proxy,
}: InternalAaveProtocolData<AAVEStrategyAddresses> & { protocolVersion: AaveVersion.v2 }) {
  const priceOracle = new ethers.Contract(addresses.priceOracle, aaveV2PriceOracleABI, provider)
  const aaveProtocolDataProvider = new ethers.Contract(
    addresses.protocolDataProvider,
    aaveV2ProtocolDataProviderABI,
    provider,
  )

  const hasProxy = !!proxy

  const promises = [
    priceOracle
      .getAssetPrice(addresses.DAI)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    priceOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    priceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aaveProtocolDataProvider.getReserveConfigurationData(addresses.DAI),
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
  addresses,
  provider,
  debtTokenAddress,
  collateralTokenAddress,
  proxy,
}: InternalAaveProtocolData<AAVEV3StrategyAddresses> & { protocolVersion: AaveVersion.v3 }) {
  const priceOracle = new ethers.Contract(
    addresses.aaveOracle,
    await getAbiForContract('aaveOracle', provider),
    provider,
  )
  const aaveProtocolDataProvider = new ethers.Contract(
    addresses.poolDataProvider,
    await getAbiForContract('poolDataProvider', provider),
    provider,
  )
  const aavePool = new ethers.Contract(
    addresses.pool,
    await getAbiForContract('pool', provider),
    provider,
  )

  const hasProxy = !!proxy

  const promises = [
    priceOracle
      .getAssetPrice(addresses.DAI)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    priceOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    priceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aaveProtocolDataProvider.getReserveConfigurationData(addresses.DAI),
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

type AllowedContractNames = 'poolDataProvider' | 'pool' | 'aaveOracle'
async function getAbiForContract(contractName: AllowedContractNames, provider: providers.Provider) {
  const network = await coalesceNetwork(provider as providers.JsonRpcProvider)
  if (network === Network.GOERLI) throw new Error('Goerli not supported yet')
  return abiByContractName[network][contractName]
}

const abiByContractName: Record<
  Network.MAINNET | Network.OPT_MAINNET,
  Record<AllowedContractNames, any>
> = {
  [Network.MAINNET]: {
    poolDataProvider: aaveV3ProtocolDataProviderABI,
    pool: aaveV3PoolABI,
    aaveOracle: aaveV3PriceOracleABI,
  },
  [Network.OPT_MAINNET]: {
    poolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
    pool: aaveV3PoolOptimismABI,
    aaveOracle: aaveV3PriceOracleOptimismABI,
  },
}
