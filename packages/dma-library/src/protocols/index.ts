import { AaveProtocolData, AaveProtocolDataArgs, getAaveProtocolData } from './aave'
import { calculateAjnaApyPerDays } from './ajna'
import { getSparkProtocolData, SparkProtocolData, SparkProtocolDataArgs } from './spark'

const aave: {
  getAaveProtocolData: typeof getAaveProtocolData
} = {
  getAaveProtocolData,
}

const spark: {
  getSparkProtocolData: typeof getSparkProtocolData
} = {
  getSparkProtocolData,
}

export const protocols = {
  aave,
  spark,
}

export { AaveProtocolData, AaveProtocolDataArgs }
export { SparkProtocolData, SparkProtocolDataArgs }

export { calculateAjnaApyPerDays }
export { calculateAjnaMaxLiquidityWithdraw, getAjnaLiquidationPrice } from './ajna/index'
