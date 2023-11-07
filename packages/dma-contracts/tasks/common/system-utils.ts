import { getConfigByNetwork } from '@deploy-configurations/configs'
import { SystemConfig, SystemConfigEntry } from '@deploy-configurations/types/deployment-config'
import { isConfigEntry } from '@deploy-configurations/types/deployment-config/config-entries'
import { Network } from '@deploy-configurations/types/network'
import { ethers } from 'ethers'

import { loadContractNames } from '../../../deploy-configurations/constants/load-contract-names'

export type SystemEntry = SystemConfigEntry & {
  path: string
}

export type ServiceNameEntry = {
  name: string
  serviceNameHash: string
  entryNameHash: string
  path: string
}
export class SystemDatabase {
  private readonly systemEntries: SystemEntry[] = []
  private readonly contractAddressToEntry: { [key: string]: SystemEntry } = {}

  private readonly serviceNameEntries: ServiceNameEntry[] = []
  private readonly hashToServiceNameEntry: { [key: string]: ServiceNameEntry } = {}

  constructor(network: Network) {
    this.buildDatabase(network)
  }

  public getEntryByAddress(address: string): SystemEntry | undefined {
    return this.contractAddressToEntry[address.toLowerCase()]
  }

  public getAllEntries(): SystemEntry[] {
    return this.systemEntries
  }

  public getServiceNameEntryByHash(hash: string): ServiceNameEntry | undefined {
    return this.hashToServiceNameEntry[hash.toLowerCase()]
  }

  public getAllServiceNames(): ServiceNameEntry[] {
    return this.serviceNameEntries
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

  private extractServiceNames(serviceRegistryNames, head = ''): ServiceNameEntry[] {
    const addDelimiter = (a, b) => (a ? `${a}.${b}` : b)

    const serviceNameEntries: ServiceNameEntry[] = Object.keys(serviceRegistryNames).reduce(
      (acc, key) => {
        const fullPath = addDelimiter(head, key)

        const entry = serviceRegistryNames[key as keyof SystemConfig]

        if (typeof entry === 'string') {
          const serviceNameEntry = {
            name: entry,
            serviceNameHash: ethers.utils.keccak256(Buffer.from(entry)),
            entryNameHash: ethers.utils.keccak256(Buffer.from(key)),
            path: fullPath,
          }
          return [...acc, serviceNameEntry]
        }

        return [...acc, ...this.extractServiceNames(entry, fullPath)]
      },
      [] as ServiceNameEntry[],
    )

    return serviceNameEntries
  }

  private buildDatabase(network: Network) {
    const config: SystemConfig = getConfigByNetwork(network as Network)

    this.systemEntries.push(...this.extractSystemEntries(config))

    this.systemEntries.forEach(systemEntry => {
      this.contractAddressToEntry[systemEntry.address.toLowerCase()] = systemEntry
    })

    const contractNames = loadContractNames(network)

    this.serviceNameEntries.push(...this.extractServiceNames(contractNames))

    this.serviceNameEntries.forEach(serviceNameEntry => {
      this.hashToServiceNameEntry[serviceNameEntry.serviceNameHash.toLowerCase()] = serviceNameEntry
      this.hashToServiceNameEntry[serviceNameEntry.entryNameHash.toLowerCase()] = serviceNameEntry
    })
  }
}
