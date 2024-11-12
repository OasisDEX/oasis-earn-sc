import { ConfigEntry } from './config-entries'

export type MorphoBlueProtocol = 'MorphoBlue' | 'AdaptiveCurveIrm' 
export type Wrapper = 'Wrapper'

export type MorphoBlueProtocolContracts = Record<MorphoBlueProtocol, ConfigEntry>

export type OptionalBlueProtocolContracts = Partial<Record<Wrapper, ConfigEntry>>