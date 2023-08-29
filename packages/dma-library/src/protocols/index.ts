import {
  AaveProtocolData,
  AaveProtocolDataArgs,
  GetAaveProtocolData,
  getAaveProtocolData,
} from './aave'
import { calculateAjnaApyPerDays } from './ajna'
import {
  GetSparkProtocolData,
  getSparkProtocolData,
  SparkProtocolData,
  SparkProtocolDataArgs,
} from './spark'

const aave: {
  getAaveProtocolData: GetAaveProtocolData
} = {
  getAaveProtocolData,
}

const spark: {
  getSparkProtocolData: GetSparkProtocolData
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
