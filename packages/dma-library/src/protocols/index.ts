import {
  getAaveV2ProtocolData,
  getAaveV3ProtocolData,
} from '@dma-library/protocols/aave/get-aave-protocol-data'
import { AaveVersion } from '@dma-library/types/aave'

import { AaveProtocol, AaveProtocolData, AaveProtocolDataArgs } from './aave'
import {
  ajnaCollateralizationFactor,
  ajnaPaybackAllWithdrawAllValueOffset,
  calculateAjnaApyPerDays,
  calculateAjnaMaxLiquidityWithdraw,
  getAjnaEarnDepositFee,
} from './ajna'
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

const ajna = {
  calculateAjnaApyPerDays,
  getAjnaEarnDepositFee,
  calculateAjnaMaxLiquidityWithdraw,
  ajnaCollateralizationFactor,
  ajnaPaybackAllWithdrawAllValueOffset,
}

export const protocols = {
  aave,
  spark,
  ajna,
}

export { AaveProtocolData, AaveProtocolDataArgs }
export { SparkProtocolData }
