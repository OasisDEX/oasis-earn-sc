import { Contract } from 'ethers'
import { ServiceRegistry } from 'utils/wrappers'
import { DeployedSystemContracts, DeploymentConfig, SystemConfig } from './deployment-config'

export type ContractProps = {
  contract: Contract
  config: DeploymentConfig | Record<string, unknown>
  hash: string
}

export type SystemTemplate = Partial<Record<DeployedSystemContracts, ContractProps>>

export type DeployedSystem = Record<DeployedSystemContracts, ContractProps>

export type System = {
  system: DeployedSystem
  registry: ServiceRegistry
  config: SystemConfig
}