import { Address } from '@deploy-configurations/types/address'

import { ConfigEntry } from './config-entries'

export type TestContractNames = 'DummyAction' | 'DummyOptionalAction' | 'DummyExchange'

export type TestConfigEntry = ConfigEntry & {
  name: TestContractNames
  deploy: boolean
  history: Address[]
  constructorArgs?: Array<number | string>
}

export type TestContracts = Record<TestContractNames, TestConfigEntry>
