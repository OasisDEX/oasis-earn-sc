import { Address } from '@deploy-configurations/types/address'
import { AaveLikeProtocol as AaveLikeProtocolContracts } from '@deploy-configurations/types/deployment-config'
import { amountFromWei } from '@dma-common/utils/common'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { PriceResult, ReserveDataResult } from '@dma-library/protocols/aave-like/types'
import { AaveLikeProtocol } from '@dma-library/types/protocol'
import { getAbiForContract } from '@dma-library/utils/abis/get-abi-for-contract'
import BigNumber from 'bignumber.js'
import { Contract, ethers, providers } from 'ethers'

export function determineReserveEModeCategory(
  collateralEModeCategory: number,
  debtEModeCategory: number,
): number {
  if (collateralEModeCategory === debtEModeCategory) {
    return collateralEModeCategory
  }
  return 0
}

export async function getContract(
  address: Address,
  contractName: AaveLikeProtocolContracts,
  provider: providers.Provider,
  protocol: AaveLikeProtocol,
): Promise<Contract> {
  const abi = await getAbiForContract(contractName, provider, protocol)
  return new ethers.Contract(address, abi, provider)
}

export async function fetchAssetPrice(
  priceOracle: Contract,
  tokenAddress?: string,
): Promise<PriceResult> {
  if (!tokenAddress) return undefined
  const amount: ethers.BigNumberish = await priceOracle.getAssetPrice(tokenAddress)
  return amountFromWei(new BigNumber(amount.toString()))
}

export async function fetchReserveData(
  dataProvider: Contract,
  tokenAddress?: string,
): Promise<ReserveDataResult> {
  if (!tokenAddress) return undefined
  return dataProvider.getReserveConfigurationData(tokenAddress)
}

export async function fetchUserReserveData(
  dataProvider: Contract,
  tokenAddress: string,
  proxy: string,
): Promise<ReserveDataResult> {
  return dataProvider.getUserReserveData(tokenAddress, proxy)
}

export async function getAaveLikeSystemContracts(
  addresses: AaveLikeStrategyAddresses,
  provider: providers.Provider,
  protocol: AaveLikeProtocol,
) {
  const oracle = await getContract(addresses.oracle, 'Oracle', provider, protocol)
  const poolDataProvider = await getContract(
    addresses.poolDataProvider,
    'PoolDataProvider',
    provider,
    protocol,
  )
  const pool = await getContract(addresses.lendingPool, 'LendingPool', provider, protocol)
  return { oracle, poolDataProvider, pool }
}
