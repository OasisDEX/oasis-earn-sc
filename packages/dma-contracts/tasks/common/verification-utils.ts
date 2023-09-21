import { ADDRESS_ZERO, loadContractNames } from '@deploy-configurations/constants'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import {
  OperationsRegistry,
  OperationsRegistry__factory,
  ServiceRegistry,
  ServiceRegistry__factory,
} from '@typechain/index'
import ethers, { Signer } from 'ethers'

import { getActionHash } from '../../../deploy-configurations/utils/action-hash'
import { Network } from '../../../dma-library/src'
import { OperationDefinition, OperationsDatabase } from './operations-utils'

export type OperationRegistryMaybe = OperationsRegistry | undefined
export type ServiceRegistryMaybe = ServiceRegistry | undefined

export type ActionDefinition = {
  hash: string
  optional: boolean
}

export type ActionValidationResult = {
  success: boolean
  errorMessage?: string
}

export type ValidationResult = {
  success: boolean
  totalEntries: number
  totalValidated: number
}

export enum OpValidationResultType {
  CONFIGURED, // The operation is in the registrry and it matches the local configuration
  OP_UNKNOWN, // The operation name does not exist in the local config
  NOT_CONFIGURED, // The operation is not in the registry
  ACTION_MISMATCH, // The operation is in the registry but it does not match the local configuration
  CONTRACT_ERROR, // An error occurred when requesting the operation from the registry
}

export type OperationValidationResult = {
  type: OpValidationResultType
  error?: string
}

export function isInvalidAddress(address: string | undefined): boolean {
  return !address || address === '' || address === '0x' || address === ADDRESS_ZERO
}

export async function getOperationRegistry(
  signerOrProvider: Signer | ethers.providers.Provider,
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
    signerOrProvider,
  )
}

export async function getServiceRegistry(
  signerOrProvider: Signer | ethers.providers.Provider,
  config: SystemConfig,
): Promise<ServiceRegistryMaybe> {
  if (
    !config.mpa.core.ServiceRegistry ||
    isInvalidAddress(config.mpa.core.ServiceRegistry.address)
  ) {
    return undefined
  }

  return ServiceRegistry__factory.connect(config.mpa.core.ServiceRegistry.address, signerOrProvider)
}

export class ActionsDatabase {
  private readonly hashToActionName: { [key: string]: string } = {}
  private readonly actionNameToHash: { [key: string]: string } = {}

  constructor(network: Network) {
    this.buildActionsDatabase(network)
  }

  public getActionName(hash: string): string | undefined {
    if (hash in this.hashToActionName) {
      return this.hashToActionName[hash]
    } else {
      return undefined
    }
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

export function validateActionHashes(
  operationHashes: string[],
  operationOptionals: boolean[],
  actionDefinitions: ActionDefinition[],
  actionsDatabase: ActionsDatabase,
): ActionValidationResult {
  let actionsValidated = true
  let actionsErrorMessage: string | undefined = undefined

  for (let actionIndex = 0; actionIndex < actionDefinitions.length; actionIndex++) {
    if (
      actionDefinitions[actionIndex].hash !== operationHashes[actionIndex] ||
      actionDefinitions[actionIndex].optional !== operationOptionals[actionIndex]
    ) {
      actionsValidated = false

      const actionDefinitionName = actionsDatabase.getActionName(
        actionDefinitions[actionIndex].hash,
      )
      const operationHashName = actionsDatabase.getActionName(operationHashes[actionIndex])

      actionsErrorMessage = `Action ${actionIndex} expected hash ${
        actionDefinitionName ? actionDefinitionName : actionDefinitions[actionIndex].hash
      } is different from registry ${
        operationHashName ? operationHashName : operationHashes[actionIndex]
      }`
      break
    }
  }

  return {
    success: actionsValidated,
    errorMessage: actionsErrorMessage,
  }
}

export async function validateOperation(
  operationName: string,
  operationRegistry: OperationsRegistry,
  operationsDatabase: OperationsDatabase,
  actionsDatabase: ActionsDatabase,
): Promise<OperationValidationResult> {
  let operationHashes: string[]
  let operationOptionals: boolean[]
  try {
    ;[operationHashes, operationOptionals] = await operationRegistry.getOperation(operationName)
  } catch (e) {
    if (!JSON.stringify(e).includes("Operation doesn't exist")) {
      return {
        type: OpValidationResultType.CONTRACT_ERROR,
        error: JSON.stringify(e),
      }
    }

    return {
      type: OpValidationResultType.NOT_CONFIGURED,
    }
  }

  const localOpDefinition: OperationDefinition | undefined =
    operationsDatabase.getDefinition(operationName)

  if (!localOpDefinition) {
    return {
      type: OpValidationResultType.OP_UNKNOWN,
    }
  }

  const actionValidationResult: ActionValidationResult = validateActionHashes(
    operationHashes,
    operationOptionals,
    localOpDefinition.actions,
    actionsDatabase,
  )

  if (!actionValidationResult.success) {
    return {
      type: OpValidationResultType.ACTION_MISMATCH,
      error: actionValidationResult.errorMessage,
    }
  }

  return {
    type: OpValidationResultType.CONFIGURED,
  }
}
