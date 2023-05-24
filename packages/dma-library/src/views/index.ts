import type { GetEarnData } from './ajna/index'
import { getAjnaBuyingPower, getEarnPosition, getPosition } from './ajna/index'

const ajna = {
  getPosition,
  getEarnPosition,
  getAjnaBuyingPower,
}
const views = {
  ajna,
}
export { GetEarnData }
export { views }
