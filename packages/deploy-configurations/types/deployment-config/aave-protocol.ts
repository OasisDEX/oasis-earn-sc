import { AaveLikeProtocol } from './aave-like-protocol'
import { ConfigEntry } from './config-entries'

export type AaveV2Protocol = AaveLikeProtocol | 'WETHGateway'
export type AaveV3Protocol = AaveLikeProtocol | 'L2Encoder' | 'RewardsController'

export type AaveV2ProtocolContracts = Record<AaveV2Protocol, ConfigEntry>
export type AaveV3ProtocolContracts = Record<AaveV3Protocol, ConfigEntry>
