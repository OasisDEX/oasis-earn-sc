import { AaveVersion } from '@dma-library/types/aave'

import {
  AaveView,
  getCurrentPositionAaveV2,
  getCurrentPositionAaveV2Omni,
  getCurrentPositionAaveV3,
  getCurrentPositionAaveV3Omni,
} from './aave'
import type { GetCumulativesData, GetEarnData } from './ajna'
import { getEarnPosition, getPosition } from './ajna'
import { getErc4626Position } from './common'
import { getMorphoPosition } from './morpho'
import {
  getCurrentSparkPosition,
  getCurrentSparkPositionOmni,
  SparkView,
  SparkViewOmni,
} from './spark'

const aave: AaveView = {
  v2: (args, dependencies) =>
    getCurrentPositionAaveV2(args, {
      ...dependencies,
      protocolVersion: AaveVersion.v2,
    }),
  v3: (args, dependencies) =>
    getCurrentPositionAaveV3(args, {
      ...dependencies,
      protocolVersion: AaveVersion.v3,
    }),
  omni: {
    v2: (args, dependencies) =>
      getCurrentPositionAaveV2Omni(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v2,
      }),
    v3: (args, dependencies) =>
      getCurrentPositionAaveV3Omni(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v3,
      }),
  },
}

const spark: SparkView = getCurrentSparkPosition
const sparkOmni: SparkViewOmni = getCurrentSparkPositionOmni
const ajna = {
  getPosition,
  getEarnPosition,
}

const morpho = {
  getPosition: getMorphoPosition,
}
const common = {
  getErc4626Position: getErc4626Position,
}
const views = {
  ajna,
  aave,
  spark,
  sparkOmni,
  morpho,
  common,
}
export { GetCumulativesData, GetEarnData }
export { views }
