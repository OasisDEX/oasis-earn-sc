import { AjnaProtocolContracts } from '@deploy-configurations/types/deployment-config/ajna-protocol'

import { AaveV2ProtocolContracts, AaveV3ProtocolContracts } from './aave-protocol'
import { ActionContracts, OptionalAaveV2Contracts, OptionalSparkContracts } from './actions'
import { AutomationContracts } from './automation'
import { CommonContracts } from './common'
import { CoreContracts, CoreMainnetOnlyContracts, OptionalUSwapContract } from './core'
import {
  MakerProtocolCommonContracts,
  MakerProtocolJoinContracts,
  MakerProtocolPipContracts,
} from './maker-protocol'
import { OptionalSparkProtocolContracts } from './spark-protocol'

// System configuration for deployment configs
export type SystemConfig = {
  mpa: {
    core: CoreContracts & CoreMainnetOnlyContracts & OptionalUSwapContract
    actions: ActionContracts & OptionalAaveV2Contracts & OptionalSparkContracts
  }
  common: CommonContracts
  aave: {
    v2: AaveV2ProtocolContracts
    v3: AaveV3ProtocolContracts
  }
  maker: {
    common: MakerProtocolCommonContracts
    joins: MakerProtocolJoinContracts
    pips: MakerProtocolPipContracts
  }
  spark: OptionalSparkProtocolContracts
  automation: AutomationContracts
  ajna: AjnaProtocolContracts
}
