export * as common from './common'
export * as maker from './maker'

import { aaveV2 } from './aave/v2'
import { aaveV3 } from './aave/v3'

export const aave = {
  v2: aaveV2,
  v3: aaveV3,
}
