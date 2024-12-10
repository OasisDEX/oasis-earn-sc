import { ConfigEntry } from './config-entries'

export type MorphoBlueProtocol = 'MorphoBlue' | 'AdaptiveCurveIrm' | 'Wrapper' | 'Bundler'

export type MorphoBlueProtocolContracts = Record<MorphoBlueProtocol, ConfigEntry>
