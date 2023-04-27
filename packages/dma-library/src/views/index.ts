import type { GetEarnData } from './ajna/index'
import { getEarnPosition, getPool, getPosition } from './ajna/index'

const ajna = {
  getPool,
  getPosition,
  getEarnPosition,
}
const views = {
  ajna,
}
export { GetEarnData }
export { views }
