import {
  arbitrumConfig,
  baseConfig,
  goerliConfig,
  mainnetConfig,
  optimismConfig,
  sepoliaConfig,
  testConfig,
} from '@deploy-configurations/configs'
import { ADDRESS_ZERO as zeroAddress } from '@deploy-configurations/constants'
import { Address } from '@deploy-configurations/types/address'
import {
  Actions,
  AjnaProtocol,
  Automation,
  Common,
  ConfigEntry,
  Contracts,
  SystemConfig,
  SystemKeys,
} from '@deploy-configurations/types/deployment-config'
import {
  AaveV2Protocol,
  AaveV3Protocol,
} from '@deploy-configurations/types/deployment-config/aave-protocol'
import { Core } from '@deploy-configurations/types/deployment-config/core'
import {
  MakerProtocol,
  MakerProtocolJoins,
  MakerProtocolPips,
} from '@deploy-configurations/types/deployment-config/maker-protocol'
import {
  OptionalSparkProtocolContracts,
  SparkProtocol,
} from '@deploy-configurations/types/deployment-config/spark-protocol'
import { Network } from '@deploy-configurations/types/network'

enum MpaKeys {
  CORE = 'core',
  ACTIONS = 'actions',
}

enum AaveKeys {
  V2 = 'v2',
  V3 = 'v3',
}

type DefaultDeployment = {
  [SystemKeys.MPA]: {
    [MpaKeys.CORE]: Record<Core, Address>
    [MpaKeys.ACTIONS]: Record<Actions, Address>
  }
  [SystemKeys.COMMON]: Record<Common, Address>
  [SystemKeys.AAVE]: {
    [AaveKeys.V2]: Record<AaveV2Protocol, Address>
    [AaveKeys.V3]: Record<AaveV3Protocol, Address>
  }
  [SystemKeys.SPARK]: Partial<Record<SparkProtocol, Address>>
  [SystemKeys.MAKER]: {
    common: Record<MakerProtocol, Address>
    joins: Record<MakerProtocolJoins, Address>
    pips: Record<MakerProtocolPips, Address>
  }
  [SystemKeys.AUTOMATION]: Record<Automation, Address>
  [SystemKeys.AJNA]: Record<AjnaProtocol, Address>
}

export type Addresses = {
  [Network.MAINNET]: DefaultDeployment
  [Network.OPTIMISM]: DefaultDeployment
  [Network.ARBITRUM]: DefaultDeployment
  [Network.BASE]: DefaultDeployment
  [Network.GOERLI]: DefaultDeployment
  [Network.SEPOLIA]: DefaultDeployment
  [Network.TEST]: DefaultDeployment
}

if (!mainnetConfig.aave.v2) throw new Error('Missing aave v2 config on mainnet')
if (!optimismConfig.aave.v3.L2Encoder) throw new Error('Missing L2Encoder config on optimism')

const createAddressesStructure = (
  networkConfig: SystemConfig,
  ajnaConfig?: SystemConfig,
): DefaultDeployment => ({
  mpa: {
    core: {
      ...extractAddressesFromConfig<Core>(networkConfig.mpa.core),
    },
    actions: {
      ...extractAddressesFromConfig<Actions>(networkConfig.mpa.actions),
    },
  },
  common: {
    ...extractAddressesFromConfig(networkConfig.common),
  },
  aave: {
    v2: {
      ...extractAddressesFromConfig(networkConfig.aave.v2),
    },
    v3: {
      ...extractAddressesFromConfig(networkConfig.aave.v3),
    },
  },
  spark: {
    ...(hasSparkConfig(networkConfig.spark) ? extractAddressesFromConfig(networkConfig.spark) : {}),
  },
  maker: {
    common: {
      ...extractAddressesFromConfig(networkConfig.maker.common),
    },
    joins: {
      ...extractAddressesFromConfig(networkConfig.maker.joins),
    },
    pips: {
      ...extractAddressesFromConfig(networkConfig.maker.pips),
    },
  },
  automation: {
    ...extractAddressesFromConfig(networkConfig.automation),
  },
  ajna: {
    ...extractAddressesFromConfig(ajnaConfig?.ajna || networkConfig.ajna),
  },
})

// Optional guards
function hasSparkConfig(
  config: OptionalSparkProtocolContracts,
): config is Record<SparkProtocol, ConfigEntry> {
  return !!config && 'PoolDataProvider' in config && 'LendingPool' in config && 'Oracle' in config
}

type ExtractAddressesFromConfig<T extends Contracts> = Record<T, ConfigEntry>

function extractAddressesFromConfig<T extends Contracts>(
  config: ExtractAddressesFromConfig<T>,
): Record<T, Address> {
  return (Object.values(config) as ConfigEntry[]).reduce<Record<T, Address>>(
    (acc: Record<T, Address>, item: ConfigEntry) => {
      if (item.address) {
        acc[item.name as T] = item.address
      }
      return acc
    },
    {} as Record<T, Address>,
  )
}

export const ADDRESSES: Addresses = {
  [Network.MAINNET]: createAddressesStructure(mainnetConfig),
  [Network.OPTIMISM]: createAddressesStructure(optimismConfig),
  [Network.GOERLI]: createAddressesStructure(goerliConfig, goerliConfig),
  [Network.ARBITRUM]: createAddressesStructure(arbitrumConfig, mainnetConfig),
  [Network.BASE]: createAddressesStructure(baseConfig, mainnetConfig),
  [Network.TEST]: createAddressesStructure(testConfig),
  [Network.SEPOLIA]: createAddressesStructure(sepoliaConfig),
}

export const ADDRESS_ZERO = zeroAddress
export type { Common }
export { SystemKeys }
