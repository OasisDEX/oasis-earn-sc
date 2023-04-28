import type { GetEarnData } from './ajna/index'
import { getEarnPosition, getPosition } from './ajna/index'

const ajna = {
  getPosition,
  getEarnPosition,
}
const views = {
  ajna,
}
export { GetEarnData }
export { views }
