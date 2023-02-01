import * as aaveV2 from './aave/getOpenProtocolData'
import * as aaveV3 from './aaveV3/getOpenV3ProtocolData'

export const aave = {
  ...aaveV2,
  ...aaveV3,
}
