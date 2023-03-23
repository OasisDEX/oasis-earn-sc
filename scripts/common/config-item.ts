import { ContractNames } from '@oasisdex/oasis-actions/src'
import { Address } from '@oasisdex/oasis-actions/src/types'

export type ConfigItem = {
  name: string
  deploy?: boolean
  serviceRegistryName?: ContractNames | ''
  address: Address
  history?: Address[]
  constructorArgs?: Array<number | string>
}

export type Config = {
  mpa: {
    core: Record<string, ConfigItem>
    actions: Record<string, ConfigItem>
  }
  common: Record<string, ConfigItem>
  aave: {
    v2: Record<string, ConfigItem>
    v3: Record<string, ConfigItem>
  }
}
