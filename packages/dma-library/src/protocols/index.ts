import type { AaveProtocolData, AaveProtocolDataArgs } from './aave/get-aave-protocol-data'
import { getAaveProtocolData } from './aave/get-aave-protocol-data'
import { calculateAjnaApyPerDays } from './ajna'

const aave: {
  getAaveProtocolData: typeof getAaveProtocolData
} = {
  getAaveProtocolData,
}

export { AaveProtocolData, AaveProtocolDataArgs }
export const protocols = {
  aave,
}

export { calculateAjnaApyPerDays }
