import { AjnaProtocolContracts } from '@deploy-configurations/types/deployment-config/ajna-protocol'

import { AaveV2ProtocolContracts, AaveV3ProtocolContracts } from './aave-protocol'
import {
  ActionContracts,
  OptionalAaveV2Contracts,
  OptionalMorphoBlueContracts,
  OptionalSparkContracts,
} from './actions'
import { AutomationContracts } from './automation'
import { CommonContracts } from './common'
import { CoreContracts, CoreMainnetOnlyContracts, OptionalUSwapContract } from './core'
import {
  MakerProtocolCommonContracts,
  MakerProtocolJoinContracts,
  MakerProtocolPipContracts,
} from './maker-protocol'
import { MorphoBlueProtocolContracts } from './morpho-blue'
import { OptionalSparkProtocolContracts } from './spark-protocol'
import { TestContracts } from './test'

// System configuration for deployment configs
export type SystemConfig = {
  mpa: {
    core: CoreContracts & CoreMainnetOnlyContracts & OptionalUSwapContract
    actions: ActionContracts &
      OptionalAaveV2Contracts &
      OptionalSparkContracts &
      OptionalMorphoBlueContracts
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
  morphoblue: MorphoBlueProtocolContracts
  test?: TestContracts
}
