import {
  arbitrumConfig,
  goerliConfig,
  mainnetConfig,
  optimismConfig,
} from '@deploy-configurations/configs'
import { ADDRESS_ZERO as zeroAddress } from '@deploy-configurations/constants'
import { Address } from '@deploy-configurations/types/address'
import {
  AaveV2Protocol,
  AaveV3Protocol,
  Actions,
  AjnaProtocol,
  AutomationProtocol,
  Common,
  Contracts,
  CoreContracts,
  DeploymentConfig,
  MakerProtocol,
  MakerProtocolJoins,
  MakerProtocolPips,
  SystemConfig,
  SystemKeys,
} from '@deploy-configurations/types/deployment-config'
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
    [MpaKeys.CORE]: Record<CoreContracts, Address>
    [MpaKeys.ACTIONS]: Record<Actions, Address>
  }
  [SystemKeys.COMMON]: Record<Common, Address>
  [SystemKeys.AAVE]: {
    [AaveKeys.V2]: Record<AaveV2Protocol, Address>
    [AaveKeys.V3]: Record<AaveV3Protocol, Address>
  }
  [SystemKeys.MAKER]: {
    common: Record<MakerProtocol, Address>
    joins: Record<MakerProtocolJoins, Address>
    pips: Record<MakerProtocolPips, Address>
  }
  [SystemKeys.AUTOMATION]: Record<AutomationProtocol, Address>
  [SystemKeys.AJNA]: Record<AjnaProtocol, Address>
}

export type Addresses = {
  [Network.MAINNET]: DefaultDeployment
  [Network.OPTIMISM]: DefaultDeployment
  [Network.ARBITRUM]: DefaultDeployment
  [Network.GOERLI]: DefaultDeployment
}

if (!mainnetConfig.aave.v2) throw new Error('Missing aave v2 config on mainnet')
if (!optimismConfig.aave.v3.L2Encoder) throw new Error('Missing L2Encoder config on optimism')

const createAddressesStructure = (
  networkConfig: SystemConfig,
  ajnaConfig?: SystemConfig,
): DefaultDeployment => ({
  mpa: {
    core: {
      ...extractAddressesFromConfig<CoreContracts>(networkConfig.mpa.core),
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

export const ADDRESSES: Addresses = {
  [Network.MAINNET]: createAddressesStructure(mainnetConfig),
  [Network.OPTIMISM]: createAddressesStructure(optimismConfig),
  [Network.GOERLI]: createAddressesStructure(goerliConfig, goerliConfig),
  [Network.ARBITRUM]: createAddressesStructure(arbitrumConfig, mainnetConfig),
}

export const ADDRESS_ZERO = zeroAddress

type ExtractAddressesFromConfig<T extends Contracts> = Record<T, DeploymentConfig>

function extractAddressesFromConfig<T extends Contracts>(
  config: ExtractAddressesFromConfig<T>,
): Record<T, Address> {
  return (Object.values(config) as DeploymentConfig[]).reduce<Record<T, Address>>(
    (acc: Record<T, Address>, item: DeploymentConfig) => {
      if (item.address) {
        acc[item.name as T] = item.address
      }
      return acc
    },
    {} as Record<T, Address>,
  )
}
