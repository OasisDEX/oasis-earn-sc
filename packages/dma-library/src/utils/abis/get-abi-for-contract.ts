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
import sparkPoolABI from '@abis/external/protocols/spark/lendingPool.json'
// ABIs for Spark
import sparkOracleABI from '@abis/external/protocols/spark/oracle.json'
import sparkPoolDataProviderABI from '@abis/external/protocols/spark/poolDataProvider.json'
// Other imports
import { AaveLikeProtocol } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { getForkedNetwork as coalesceNetwork } from '@deploy-configurations/utils/network/index'
import { Protocol } from '@dma-library/types'
import { ContractInterface } from '@ethersproject/contracts'
import { providers } from 'ethers'

export async function getAbiForContract(
  contractName: AaveLikeProtocol,
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
  Record<Network, Partial<Record<Protocol, Record<AaveLikeProtocol, ContractInterface>>>>
> = {
  [Network.MAINNET]: {
    AAVE: {
      PoolDataProvider: aaveV2PoolDataProviderABI,
      LendingPool: aaveV2PoolABI,
      Oracle: aaveV2OracleABI,
    },
    AAVE_V3: {
      LendingPool: aaveV3PoolABI,
      PoolDataProvider: aaveV3ProtocolDataProviderABI,
      Oracle: aaveV3PriceOracleABI,
    },
    Spark: {
      PoolDataProvider: sparkPoolDataProviderABI,
      LendingPool: sparkPoolABI,
      Oracle: sparkOracleABI,
    },
  },
  [Network.OPTIMISM]: {
    AAVE_V3: {
      PoolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
      LendingPool: aaveV3PoolOptimismABI,
      Oracle: aaveV3PriceOracleOptimismABI,
    },
    Spark: {
      PoolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
      LendingPool: aaveV3PoolOptimismABI,
      Oracle: aaveV3PriceOracleOptimismABI,
    },
  },
  [Network.ARBITRUM]: {
    AAVE_V3: {
      PoolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
      LendingPool: aaveV3PoolOptimismABI,
      Oracle: aaveV3PriceOracleOptimismABI,
    },
  },
  [Network.BASE]: {
    AAVE_V3: {
      PoolDataProvider: aaveV3ProtocolDataProviderOptimismABI,
      LendingPool: aaveV3PoolOptimismABI,
      Oracle: aaveV3PriceOracleOptimismABI,
    },
  },
}
