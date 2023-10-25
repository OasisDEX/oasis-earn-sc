import { AaveVersion } from '@dma-library/types/aave'

import { AaveView, getCurrentPositionAaveV2, getCurrentPositionAaveV3 } from './aave'
import type { GetCumulativesData, GetEarnData } from './ajna'
import { getEarnPosition, getPosition } from './ajna'
import { getMorphoPosition } from './morpho'
import { getCurrentSparkPosition, SparkView } from './spark'

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
}
const spark: SparkView = getCurrentSparkPosition
const ajna = {
  getPosition,
  getEarnPosition,
}

const morpho = {
  getPosition: getMorphoPosition,
}

const views = {
  ajna,
  aave,
  spark,
  morpho,
}
export { GetCumulativesData, GetEarnData }
export { views }
