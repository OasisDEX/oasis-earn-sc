import { ConfigEntry } from './config-entries'

export type MorphoBlueProtocol = 'MorphoBlue' | 'AdaptiveCurveIrm'

export type MorphoBlueProtocolContracts = Record<MorphoBlueProtocol, ConfigEntry>
