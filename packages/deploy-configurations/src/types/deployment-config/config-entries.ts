import { ContractNames } from '@deploy-configurations/constants'
import { Address } from '@deploy-configurations/types/address'

import { AaveV2Protocol, AaveV3Protocol } from './aave-protocol'
import { AaveV2Actions, Actions, MorphoBlueActions, SparkActions } from './actions'
import { AjnaProtocol } from './ajna-protocol'
import { Automation } from './automation'
import { Common } from './common'
import { Core, CoreMainnetOnly, USwapContract } from './core'
import { MakerProtocol, MakerProtocolJoins, MakerProtocolPips } from './maker-protocol'
import { MorphoBlueProtocol } from './morpho-blue'
import { SparkProtocol } from './spark-protocol'
import { TestContractNames } from './test'

export type ExternalContracts =
  | Common
  | AaveV2Protocol
  | AaveV3Protocol
  | SparkProtocol
  | MakerProtocol
  | MakerProtocolJoins
  | MakerProtocolPips
  | Automation
  | AjnaProtocol
  | MorphoBlueProtocol

export type SystemContracts =
  | Core
  | USwapContract
  | CoreMainnetOnly
  | Actions
  | AaveV2Actions
  | SparkActions
  | MorphoBlueActions
  | TestContractNames

export type Contracts = SystemContracts | ExternalContracts

export type ConfigEntry = {
  name: Contracts
  serviceRegistryName?: ContractNames
  address: Address
}

export type SystemConfigEntry = ConfigEntry & {
  name: SystemContracts
  deploy: boolean
  history: Address[]
  constructorArgs?: Array<number | string>
}

export function isConfigEntry(entry: any): entry is ConfigEntry {
  return entry.name !== undefined && entry.address !== undefined
}

export function isSystemConfigEntry(entry: any): entry is SystemConfigEntry {
  return entry.deploy !== undefined && entry.history !== undefined && isConfigEntry(entry)
}
