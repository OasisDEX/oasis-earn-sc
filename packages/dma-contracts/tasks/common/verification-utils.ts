import { ADDRESS_ZERO } from '@deploy-configurations/constants'
import { loadContractNames } from '@deploy-configurations/constants'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import {
  OperationsRegistry,
  OperationsRegistry__factory,
  ServiceRegistry,
  ServiceRegistry__factory,
} from '@typechain/index'

import { getActionHash } from '../../../deploy-configurations/utils/action-hash'
import { Network } from '../../../dma-library/src'

export type OperationRegistryMaybe = OperationsRegistry | undefined
export type ServiceRegistryMaybe = ServiceRegistry | undefined

export type ActionDefinition = {
  hash: string
  optional: boolean
}

export type OperationDefinition = {
  name: string
  actions: ActionDefinition[]
}

export type OperationDefinitionGetter = (string) => OperationDefinition

export type ActionValidationResult = {
  success: boolean
  errorMessage?: string
}

export type VerificationResult = {
  success: boolean
  totalEntries: number
  totalValidated: number
}

export function isInvalidAddress(address: string | undefined): boolean {
  return !address || address === '' || address === '0x' || address === ADDRESS_ZERO
}

export async function getOperationRegistry(
  ethers,
  config: SystemConfig,
): Promise<OperationRegistryMaybe> {
  if (
    !config.mpa.core.OperationsRegistry ||
    isInvalidAddress(config.mpa.core.OperationsRegistry.address)
  ) {
    return undefined
  }

  return OperationsRegistry__factory.connect(
    config.mpa.core.OperationsRegistry.address,
    ethers.provider,
  )
}

export async function getServiceRegistry(
  ethers,
  config: SystemConfig,
): Promise<ServiceRegistryMaybe> {
  if (
    !config.mpa.core.ServiceRegistry ||
    isInvalidAddress(config.mpa.core.ServiceRegistry.address)
  ) {
    return undefined
  }

  return ServiceRegistry__factory.connect(config.mpa.core.ServiceRegistry.address, ethers.provider)
}

export class ActionsDatabase {
  private readonly hashToActionName: { [key: string]: string } = {}
  private readonly actionNameToHash: { [key: string]: string } = {}

  constructor(network: Network) {
    this.buildActionsDatabase(network)
  }

  public getActionName(hash: string): string {
    return this.hashToActionName[hash]
  }

  public getActionHash(name: string): string {
    return getActionHash(name)
  }

  private buildActionsDatabase(network: Network) {
    const SERVICE_REGISTRY_NAMES = loadContractNames(network)
    this.recurseActionNames(SERVICE_REGISTRY_NAMES)
  }
  private recurseActionNames(object: any) {
    Object.entries(object).forEach(([, value]) => {
      if (typeof value === 'string') {
        const hash = getActionHash(value)
        this.hashToActionName[hash] = value
        this.actionNameToHash[value] = hash
      } else {
        this.recurseActionNames(value)
      }
    })
  }
}
