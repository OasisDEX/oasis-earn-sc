import DefaultMorphoMarketsConfigJSON from './markets-config.json'
import { MorphoMarketsConfig } from '@types'

export const MorphoLLTVPrecision = 18

export const DefaultMorphoMarketsConfig = DefaultMorphoMarketsConfigJSON as MorphoMarketsConfig

export function getMorphoDefaultMarketsConfig(): MorphoMarketsConfig {
  return DefaultMorphoMarketsConfig
}
