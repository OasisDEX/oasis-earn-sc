import { ConfigEntry } from './config-entries'

export type MorphoBlueProtocol = 'MorphoBlue' | 'AdaptiveCurveIrm' | 'Wrapper'

export type MorphoBlueProtocolContracts = Record<MorphoBlueProtocol, ConfigEntry>
