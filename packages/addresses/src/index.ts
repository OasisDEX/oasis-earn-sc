import { goerliConfig, mainnetConfig, optimismConfig } from '@oasisdex/dma-deployments'

import {
  AaveV2Protocol,
  AaveV3Protocol,
  AaveV3ProtocolOptimism,
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
  SystemKeys,
} from '@oasisdex/dma-deployments/types/deployment-config'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { Address } from '@oasisdex/dma-common/types/address'

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

type AaveDeployment = {
  [SystemKeys.AAVE]: {
    [AaveKeys.V2]: Record<AaveV2Protocol, Address>
    [AaveKeys.V3]: Record<AaveV3Protocol, Address>
  }
}

type OptimismAaveDeployment = {
  [SystemKeys.AAVE]: {
    [AaveKeys.V3]: Record<AaveV3Protocol | AaveV3ProtocolOptimism, Address>
  }
}

type MainnetDeployment = Omit<DefaultDeployment, SystemKeys.AAVE> & AaveDeployment
type OptimismDeployment = Omit<DefaultDeployment, SystemKeys.AAVE> & OptimismAaveDeployment

export type Addresses = {
  [Network.MAINNET]: MainnetDeployment
  [Network.OPTIMISM]: OptimismDeployment
  [Network.GOERLI]: DefaultDeployment
}

if (!mainnetConfig.aave.v2) throw new Error('Missing aave v2 config on mainnet')
if (!optimismConfig.aave.v3.L2Encoder) throw new Error('Missing L2Encoder config on optimism')
export const ADDRESSES: Addresses = {
  [Network.MAINNET]: {
    mpa: {
      core: {
        ...extractAddressesFromConfig<CoreContracts>(mainnetConfig.mpa.core),
      },
      actions: {
        ...extractAddressesFromConfig<Actions>(mainnetConfig.mpa.actions),
      },
    },
    common: {
      ...extractAddressesFromConfig(mainnetConfig.common),
    },
    aave: {
      v2: {
        ...extractAddressesFromConfig(mainnetConfig.aave.v2),
      },
      v3: {
        ...extractAddressesFromConfig<AaveV3Protocol>(mainnetConfig.aave.v3),
      },
    },
    maker: {
      common: {
        ...extractAddressesFromConfig(mainnetConfig.maker.common),
      },
      joins: {
        ...extractAddressesFromConfig(mainnetConfig.maker.joins),
      },
      pips: {
        ...extractAddressesFromConfig(mainnetConfig.maker.pips),
      },
    },
    automation: {
      ...extractAddressesFromConfig(mainnetConfig.automation),
    },
    ajna: {
      ...extractAddressesFromConfig(mainnetConfig.ajna),
    },
  },
  [Network.OPTIMISM]: {
    mpa: {
      core: {
        ...extractAddressesFromConfig<CoreContracts>(optimismConfig.mpa.core),
      },
      actions: {
        ...extractAddressesFromConfig<Actions>(optimismConfig.mpa.actions),
      },
    },
    common: {
      ...extractAddressesFromConfig(optimismConfig.common),
    },
    aave: {
      v3: {
        ...extractAddressesFromConfig<AaveV3Protocol | AaveV3ProtocolOptimism>(
          optimismConfig.aave.v3 as Record<
            AaveV3Protocol | AaveV3ProtocolOptimism,
            DeploymentConfig
          >,
        ),
      },
    },
    maker: {
      common: {
        ...extractAddressesFromConfig(optimismConfig.maker.common),
      },
      joins: {
        ...extractAddressesFromConfig(optimismConfig.maker.joins),
      },
      pips: {
        ...extractAddressesFromConfig(optimismConfig.maker.pips),
      },
    },
    automation: {
      ...extractAddressesFromConfig(optimismConfig.automation),
    },
    ajna: {
      ...extractAddressesFromConfig(mainnetConfig.ajna),
    },
  },
  [Network.GOERLI]: {
    mpa: {
      core: {
        ...extractAddressesFromConfig<CoreContracts>(goerliConfig.mpa.core),
      },
      actions: {
        ...extractAddressesFromConfig<Actions>(goerliConfig.mpa.actions),
      },
    },
    common: {
      ...extractAddressesFromConfig(goerliConfig.common),
    },
    aave: {
      v2: {
        ...extractAddressesFromConfig(goerliConfig.aave.v2!),
      },
      v3: {
        ...extractAddressesFromConfig<AaveV3Protocol>(goerliConfig.aave.v3),
      },
    },
    maker: {
      common: {
        ...extractAddressesFromConfig(goerliConfig.maker.common),
      },
      joins: {
        ...extractAddressesFromConfig(goerliConfig.maker.joins),
      },
      pips: {
        ...extractAddressesFromConfig(goerliConfig.maker.pips),
      },
    },
    automation: {
      ...extractAddressesFromConfig(goerliConfig.automation),
    },
    ajna: {
      ...extractAddressesFromConfig(mainnetConfig.ajna),
    },
  },
}

export { SystemKeys, DefaultDeployment }

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
