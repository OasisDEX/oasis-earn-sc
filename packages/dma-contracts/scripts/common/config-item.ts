import { ContractNames } from '@dma-library'
import { Address } from '@dma-library/types'

export type ConfigItem = {
  name: string
  serviceRegistryName?: ContractNames
  address: Address
}

export type SystemConfigItem = ConfigItem & {
  deploy: boolean
  history: Address[]
  constructorArgs?: Array<number | string>
}

export type Config = {
  mpa: {
    core: Record<string, SystemConfigItem>
    actions: Record<string, SystemConfigItem>
  }
  common: Record<string, ConfigItem>
  aave: {
    v2: Record<string, ConfigItem>
    v3: Record<string, ConfigItem>
  }
}
