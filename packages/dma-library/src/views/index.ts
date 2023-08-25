import type { GetCumulativesData, GetEarnData } from './ajna/index'
import { getEarnPosition, getPosition } from './ajna/index'

const ajna = {
  getPosition,
  getEarnPosition,
}
const views = {
  ajna,
}
export { GetCumulativesData, GetEarnData }
export { views }
