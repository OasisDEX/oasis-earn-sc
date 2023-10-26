import { getConfigByNetwork } from '@deploy-configurations/configs'
import { SystemConfig, SystemConfigEntry } from '@deploy-configurations/types/deployment-config'
import { isConfigEntry } from '@deploy-configurations/types/deployment-config/config-entries'
import { Network } from '@deploy-configurations/types/network'

export type SystemEntry = SystemConfigEntry & {
  path: string
}

export class SystemDatabase {
  private readonly contractAddressToEntry: { [key: string]: SystemEntry } = {}
  private readonly systemEntries: SystemEntry[] = []

  constructor(network: Network) {
    this.buildDatabase(network)
  }

  public getEntryByAddress(address: string): SystemEntry | undefined {
    return this.contractAddressToEntry[address]
  }

  public getAllEntries(): SystemEntry[] {
    return this.systemEntries
  }

  private extractSystemEntries(config, head = ''): SystemEntry[] {
    const addDelimiter = (a, b) => (a ? `${a}.${b}` : b)

    const systemEntries: SystemEntry[] = Object.keys(config).reduce((acc, key) => {
      const fullPath = addDelimiter(head, key)

      const entry = config[key as keyof SystemConfig]

      if (isConfigEntry(entry)) {
        const systemEntry = entry as SystemEntry
        systemEntry.path = fullPath
        return [...acc, systemEntry]
      }

      return [...acc, ...this.extractSystemEntries(entry, fullPath)]
    }, [] as SystemEntry[])

    return systemEntries
  }

  private buildDatabase(network: Network) {
    const config: SystemConfig = getConfigByNetwork(network as Network)

    this.systemEntries.push(...this.extractSystemEntries(config))

    this.systemEntries.forEach(systemEntry => {
      this.contractAddressToEntry[systemEntry.address] = systemEntry
    })
  }
}
