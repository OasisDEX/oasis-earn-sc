import { ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { Contract } from 'ethers'

import { ConfigEntry, SystemConfig, SystemContracts } from './deployment-config'

export type ContractProps = {
  contract: Contract
  config: ConfigEntry | Record<string, unknown>
  hash: string
}

export type SystemTemplate = Partial<Record<SystemContracts, ContractProps>>

export type DeployedSystem = Record<SystemContracts, ContractProps>

export type System = {
  system: DeployedSystem
  registry: ServiceRegistry
  config: SystemConfig
}
