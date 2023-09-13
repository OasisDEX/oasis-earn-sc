import { ContractNames } from '@deploy-configurations/constants'
import { Address } from '@deploy-configurations/types/address'

import { AaveV2Protocol, AaveV3Protocol } from './aave-protocol'
import { AaveV2Actions, Actions, SparkActions } from './actions'
import { AjnaProtocol } from './ajna-protocol'
import { Automation } from './automation'
import { Common } from './common'
import { Core, CoreMainnetOnly, USwapContract } from './core'
import { MakerProtocol, MakerProtocolJoins, MakerProtocolPips } from './maker-protocol'
import { SparkProtocol } from './spark-protocol'

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

export type SystemContracts =
  | Core
  | USwapContract
  | CoreMainnetOnly
  | Actions
  | AaveV2Actions
  | SparkActions

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
