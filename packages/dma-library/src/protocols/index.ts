import {
  getAaveV2ProtocolData,
  getAaveV3ProtocolData,
} from '@dma-library/protocols/aave/get-aave-protocol-data'
import { AaveVersion } from '@dma-library/types/aave'

import { AaveProtocol, AaveProtocolData, AaveProtocolDataArgs } from './aave'
import { calculateAjnaApyPerDays } from './ajna'
import { getSparkProtocolData, SparkProtocol, SparkProtocolData } from './spark'

const aave: AaveProtocol = {
  v2: args =>
    getAaveV2ProtocolData({
      ...args,
      protocolVersion: AaveVersion.v2,
    }),
  v3: args =>
    getAaveV3ProtocolData({
      ...args,
      protocolVersion: AaveVersion.v3,
    }),
}

const spark: SparkProtocol = getSparkProtocolData

export const protocols = {
  aave,
  spark,
}

export { AaveProtocolData, AaveProtocolDataArgs }
export { SparkProtocolData }

export { calculateAjnaApyPerDays }
export { calculateAjnaMaxLiquidityWithdraw } from './ajna/index'
