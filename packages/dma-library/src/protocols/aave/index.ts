import {
  AaveProtocolData,
  AaveV2ProtocolDataArgs,
  AaveV3ProtocolDataArgs,
} from './get-aave-protocol-data'

export {
  AaveProtocolData,
  AaveProtocolDataArgs,
  GetAaveProtocolData,
  getAaveProtocolData,
} from './get-aave-protocol-data'

export type AaveProtocol = {
  v2: (args: AaveV2ProtocolDataArgs) => Promise<AaveProtocolData>
  v3: (args: AaveV3ProtocolDataArgs) => Promise<AaveProtocolData>
}
