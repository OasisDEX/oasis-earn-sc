import type { AaveProtocolData, AaveProtocolDataArgs } from './aave/get-aave-protocol-data'
import { getAaveProtocolData } from './aave/get-aave-protocol-data'

const aave: {
  getAaveProtocolData: typeof getAaveProtocolData
} = {
  getAaveProtocolData,
}

export { AaveProtocolData, AaveProtocolDataArgs }
export const protocols = {
  aave,
}
