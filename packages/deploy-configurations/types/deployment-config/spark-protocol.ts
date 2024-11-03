import { AaveLikeProtocol } from './aave-like-protocol'
import { ConfigEntry } from './config-entries'

export type SparkProtocol = AaveLikeProtocol | 'RewardsController'
export type OptionalSparkProtocolContracts = Partial<Record<SparkProtocol, ConfigEntry>>
