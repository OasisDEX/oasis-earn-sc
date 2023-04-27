import { aaveV2 } from './aave/v2'
import { aaveV3 } from './aave/v3'
import * as common from './common'
import * as maker from './maker'

export const aave = {
  v2: aaveV2,
  v3: aaveV3,
}

export { common, maker }
