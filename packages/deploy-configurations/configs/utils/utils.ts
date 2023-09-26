import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'

import { config as arbitrumConfig } from '../arbitrum.conf'
import { config as baseConfig } from '../base.conf'
import { config as goerliConfig } from '../goerli.conf'
import { config as localConfig } from '../local.conf'
import { config as mainnetConfig } from '../mainnet.conf'
import { config as optimismConfig } from '../optimism.conf'
import { config as tenderlyConfig } from '../tenderly.conf'

export function getConfigByNetwork(network: Network): SystemConfig {
  if (network === Network.MAINNET) {
    return mainnetConfig
  } else if (network === Network.GOERLI) {
    return goerliConfig
  } else if (network === Network.ARBITRUM) {
    return arbitrumConfig
  } else if (network === Network.OPTIMISM) {
    return optimismConfig
  } else if (network === Network.BASE) {
    return baseConfig
  } else if (network === Network.LOCAL) {
    return localConfig
  } else if (network === Network.TENDERLY) {
    return tenderlyConfig
  } else {
    throw new Error(`Unknown network ${network}`)
  }
}
