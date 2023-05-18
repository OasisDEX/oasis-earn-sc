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
  SystemKeys,
} from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'

import { goerliConfig, mainnetConfig, optimismConfig } from '../configs'
import { ADDRESS_ZERO as zeroAddress } from '../constants/address-zero'

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
        ...extractAddressesFromConfig(mainnetConfig.aave.v3),
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
      v2: {
        ...extractAddressesFromConfig(optimismConfig.aave.v2),
      },
      v3: {
        ...extractAddressesFromConfig(optimismConfig.aave.v3),
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
        ...extractAddressesFromConfig(goerliConfig.aave.v2),
      },
      v3: {
        ...extractAddressesFromConfig(goerliConfig.aave.v3),
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
      ...extractAddressesFromConfig(goerliConfig.ajna),
    },
  },
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
