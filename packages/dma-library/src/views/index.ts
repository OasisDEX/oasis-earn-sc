import { getCurrentPosition } from '@dma-library/views/aave'

import type { GetEarnData } from './ajna/index'
import { getEarnPosition, getPosition } from './ajna/index'

const aave = {
  getCurrentPosition,
}
const ajna = {
  getPosition,
  getEarnPosition,
}
const views = {
  ajna,
  aave,
}
export { GetEarnData }
export { views }
