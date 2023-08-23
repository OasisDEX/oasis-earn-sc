import aaveV2PoolABI from '@abis/external/protocols/aave/v2/lendingPool.json'
// ABIs for AAVE V2
import aaveV2OracleABI from '@abis/external/protocols/aave/v2/priceOracle.json'
import aaveV2PoolDataProviderABI from '@abis/external/protocols/aave/v2/protocolDataProvider.json'
// ABIs for AAVE V3
import aaveV3PriceOracleABI from '@abis/external/protocols/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import aaveV3PoolABI from '@abis/external/protocols/aave/v3/pool.json'
// ABIs for AAVE V3 Optimism
import aaveV3PriceOracleOptimismABI from '@abis/external/protocols/aave/v3-l2/aaveOracle.json'
import aaveV3ProtocolDataProviderOptimismABI from '@abis/external/protocols/aave/v3-l2/aaveProtocolDataProvider.json'
import aaveV3PoolOptimismABI from '@abis/external/protocols/aave/v3-l2/pool.json'
// Other imports
import { Network } from '@deploy-configurations/types/network'
import { getForkedNetwork as coalesceNetwork } from '@deploy-configurations/utils/network/index'
import { Protocol } from '@dma-library/types'
import { ContractInterface } from '@ethersproject/contracts'
import { providers } from 'ethers'

export type AllowedContractNames = 'poolDataProvider' | 'pool' | 'oracle'

export async function getAbiForContract(
  contractName: AllowedContractNames,
  provider: providers.Provider,
  protocol: Protocol,
): Promise<ContractInterface> {
  const network = await coalesceNetwork(provider as providers.JsonRpcProvider)
  if (network === Network.GOERLI) throw new Error('Goerli not supported yet')
  if (!abiByContractName[network]) {
    throw new Error(`ABI not available for any protocol on ${network}`)
  }

  if (!abiByContractName[network]?.[protocol]) {
    throw new Error(`ABI not available for ${protocol} on ${network}`)
  }
  const abi = abiByContractName[network]?.[protocol]?.[contractName]
  if (!abi) {
    throw new Error(`ABI not available for ${contractName} on ${protocol} on ${network}`)
  }

  return abi
}

const abiByContractName: Partial<
  Record<Network, Partial<Record<Protocol, Record<AllowedContractNames, ContractInterface>>>>
> = {
  [Network.MAINNET]: {
    AAVE: {
      poolDataProvider: aaveV2PoolDataProviderABI,
      pool: aaveV2PoolABI,
      oracle: aaveV2OracleABI,
    },
    AAVE_V3: {
      poolDataProvider: aaveV3ProtocolDataProviderABI,
      pool: aaveV3PoolABI,
      oracle: aaveV3PriceOracleABI,
    },
    Spark: {
      poolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
      pool: aaveV3PoolOptimismABI,
      oracle: aaveV3PriceOracleOptimismABI,
    },
  },
  [Network.OPTIMISM]: {
    AAVE_V3: {
      poolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
      pool: aaveV3PoolOptimismABI,
      oracle: aaveV3PriceOracleOptimismABI,
    },
    Spark: {
      poolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
      pool: aaveV3PoolOptimismABI,
      oracle: aaveV3PriceOracleOptimismABI,
    },
  },
}
