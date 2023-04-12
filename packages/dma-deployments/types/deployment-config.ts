import { ContractNames } from 'constants'
import { Address } from 'types/address'

export type DeploymentConfig = {
  name: string
  serviceRegistryName?: ContractNames
  address: Address
}

export type SystemConfigItem = DeploymentConfig & {
  deploy: boolean
  history: Address[]
  constructorArgs?: Array<number | string>
}

export type Config = {
  mpa: {
    core: Record<string, SystemConfigItem>
    actions: Record<string, SystemConfigItem>
  }
  common: Record<string, DeploymentConfig>
  aave: {
    v2: Record<string, DeploymentConfig>
    v3: Record<string, DeploymentConfig>
  }
}
