import aaveV3PriceOracleABI from '@abis/external/protocols/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import aaveV3PoolABI from '@abis/external/protocols/aave/v3/pool.json'
import aaveV3PriceOracleOptimismABI from '@abis/external/protocols/aave/v3-l2/aaveOracle.json'
import aaveV3ProtocolDataProviderOptimismABI from '@abis/external/protocols/aave/v3-l2/aaveProtocolDataProvider.json'
import aaveV3PoolOptimismABI from '@abis/external/protocols/aave/v3-l2/pool.json'
import { Network } from '@deploy-configurations/types/network'
import { getForkedNetwork as coalesceNetwork } from '@deploy-configurations/utils/network/index'
import { ContractInterface } from '@ethersproject/contracts'
import { providers } from 'ethers'

type AllowedContractNames = 'poolDataProvider' | 'pool' | 'aaveOracle'

export async function getAbiForContract(
  contractName: AllowedContractNames,
  provider: providers.Provider,
): Promise<ContractInterface> {
  const network = await coalesceNetwork(provider as providers.JsonRpcProvider)
  if (network === Network.GOERLI) throw new Error('Goerli not supported yet')
  return abiByContractName[network][contractName]
}

const abiByContractName: Record<
  Network.MAINNET | Network.OPTIMISM,
  Record<AllowedContractNames, ContractInterface>
> = {
  [Network.MAINNET]: {
    poolDataProvider: aaveV3ProtocolDataProviderABI,
    pool: aaveV3PoolABI,
    aaveOracle: aaveV3PriceOracleABI,
  },
  [Network.OPTIMISM]: {
    poolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
    pool: aaveV3PoolOptimismABI,
    aaveOracle: aaveV3PriceOracleOptimismABI,
  },
}
