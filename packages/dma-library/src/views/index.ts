import { AaveView, getCurrentPositionAaveV2, getCurrentPositionAaveV3 } from './aave'
import type { GetEarnData } from './ajna'
import { getEarnPosition, getPosition } from './ajna'
import { getCurrentPosition, SparkView } from './spark'

const aave: AaveView = {
  getCurrentPosition,
  v2: getCurrentPositionAaveV2,
  v3: getCurrentPositionAaveV3,
}
const spark: SparkView = {
  getCurrentPosition: getCurrentPosition,
}
const ajna = {
  getPosition,
  getEarnPosition,
}
const views = {
  ajna,
  aave,
  spark,
}
export { GetEarnData }
export { views }
