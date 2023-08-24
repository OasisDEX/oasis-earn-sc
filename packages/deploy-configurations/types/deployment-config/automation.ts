import { ConfigEntry } from './config-entries'

export type Automation = 'AutomationBot' | 'AutomationBotV2' | 'AutomationBotAggregator'
export type AutomationContracts = Record<Automation, ConfigEntry>
