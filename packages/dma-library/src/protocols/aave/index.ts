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
  v2: (args: Omit<AaveV2ProtocolDataArgs, 'protocolVersion'>) => Promise<AaveProtocolData>
  v3: (args: Omit<AaveV3ProtocolDataArgs, 'protocolVersion'>) => Promise<AaveProtocolData>
}
