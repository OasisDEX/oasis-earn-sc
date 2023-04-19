import { config as mainnetConfig } from '@oasisdex/dma-deployments/configs/mainnet.conf'
import { config as optimismConfig } from '@oasisdex/dma-deployments/configs/optimism.conf'
import { config as goerliConfig } from '@oasisdex/dma-deployments/configs/goerli.conf'

import { DeploymentConfig, SystemKeys } from '@oasisdex/dma-deployments/types/deployment-config'
import { Network } from '@oasisdex/dma-deployments/types/network'

type DeployedNetworks = Network.MAINNET | Network.OPT_MAINNET | Network.GOERLI
// TODO: Make address entries type safe after https://github.com/OasisDEX/oasis-earn-sc/pull/249/files is merged
export type Addresses = Record<DeployedNetworks, Record<SystemKeys, any>>

export const ADDRESSES: Addresses = {
  [Network.MAINNET]: {
    mpa: {
      core: {
        ...extractAddressesFromConfig(mainnetConfig.mpa.core),
      },
      actions: {
        ...extractAddressesFromConfig(mainnetConfig.mpa.actions),
      },
    },
    common: {
      ...extractAddressesFromConfig(mainnetConfig.common),
    },
    aave: {
      v2: {
        ...(mainnetConfig.aave.v2 ? extractAddressesFromConfig(mainnetConfig.aave.v2) : {}),
      },
      v3: {
        ...extractAddressesFromConfig(mainnetConfig.aave.v3),
      },
    },
    maker: {
      ...extractAddressesFromConfig(mainnetConfig.maker),
    },
  },
  [Network.OPT_MAINNET]: {
    mpa: {
      core: {
        ...extractAddressesFromConfig(optimismConfig.mpa.core),
      },
      actions: {
        ...extractAddressesFromConfig(optimismConfig.mpa.actions),
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
  },
  [Network.GOERLI]: {
    mpa: {
      core: {
        ...extractAddressesFromConfig(goerliConfig.mpa.core),
      },
      actions: {
        ...extractAddressesFromConfig(goerliConfig.mpa.actions),
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
  },
}

function extractAddressesFromConfig(
  config: Record<string, DeploymentConfig>,
): Record<string, string> {
  return Object.values(config).reduce((acc, item) => {
    if (item.address) {
      acc[item.name] = item.address
    }
    return acc
  }, {})
}
