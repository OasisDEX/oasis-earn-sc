import { config as mainnetConfig } from '@oasisdex/dma-deployments/configs/mainnet.conf'
import { config as optimismConfig } from '@oasisdex/dma-deployments/configs/optimism.conf'
import { config as goerliConfig } from '@oasisdex/dma-deployments/configs/goerli.conf'

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
  SystemKeys,
} from '@oasisdex/dma-deployments/types/deployment-config'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { Address } from '@oasisdex/dma-common/types/address'

type DeployedNetworks = Network.MAINNET | Network.OPTIMISM | Network.GOERLI

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
  [SystemKeys.MAKER]: Record<MakerProtocol, Address>
  [SystemKeys.AUTOMATION]: Record<AutomationProtocol, Address>
  [SystemKeys.AJNA]: Record<AjnaProtocol, Address>
}

type AaveDeployment = {
  [SystemKeys.AAVE]: {
    [AaveKeys.V2]: Record<AaveV2Protocol, Address>
    [AaveKeys.V3]: Record<AaveV3Protocol, Address>
  }
}

type MainnetDeployment = Omit<DefaultDeployment, SystemKeys.AAVE> & AaveDeployment

export type Addresses = {
  [Network.MAINNET]: MainnetDeployment
  [Network.OPTIMISM]: DefaultDeployment
  [Network.GOERLI]: DefaultDeployment
}

if (!mainnetConfig.aave.v2) throw new Error('Missing aave v2 config on mainnet')
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
        ...extractAddressesFromConfig(mainnetConfig.aave.v3),
      },
    },
    maker: {
      ...extractAddressesFromConfig(mainnetConfig.maker),
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
        ...extractAddressesFromConfig(optimismConfig.aave.v3),
      },
    },
    maker: {
      ...extractAddressesFromConfig(optimismConfig.maker),
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
      v3: {
        ...extractAddressesFromConfig(goerliConfig.aave.v3),
      },
    },
    maker: {
      ...extractAddressesFromConfig(goerliConfig.maker),
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
  return Object.values(config).reduce((acc: Record<T, Address>, item) => {
    if ((item as DeploymentConfig).address) {
      acc[(item as DeploymentConfig).name] = (item as DeploymentConfig).address
    }
    return acc
  }, {} as Record<T, Address>)
}
