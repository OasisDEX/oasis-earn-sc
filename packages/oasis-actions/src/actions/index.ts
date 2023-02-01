import * as aaveV2 from './aaveV2'
import * as aaveV3 from './aaveV3'
export * as common from './common'
export * as maker from './maker'

export const aave = {
  ...aaveV2,
  ...aaveV3,
}
