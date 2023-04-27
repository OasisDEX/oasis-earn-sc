import type { AAVEV3StrategyAddresses } from './addresses'
import { adjustRiskDown } from './adjust-risk-down'
import { adjustRiskUp } from './adjust-risk-up'
import { close } from './close'
import { open } from './open'

export type { AAVEV3StrategyAddresses }

export const v3 = { adjustRiskDown, adjustRiskUp, close, open }
