import { AaveProtocolData, AaveProtocolDataArgs, getAaveProtocolData } from './aave'
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
export { calculateAjnaMaxLiquidityWithdraw, getAjnaLiquidationPrice } from './ajna/index'
