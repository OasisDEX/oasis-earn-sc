import {
  AaveProtocolData,
  AaveProtocolDataArgs,
  getAaveProtocolData,
  isAaveV2Addresses,
  isAaveV3Addresses,
} from './aave'
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

export { isAaveV2Addresses, isAaveV3Addresses }
export { calculateAjnaApyPerDays }

export { getAjnaLiquidationPrice } from './ajna/index'
