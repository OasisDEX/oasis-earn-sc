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

/**
 * Result of validating the state of the OperationRegistry. The registry is an onchain
 * contract that holds information about which operations are allowed in the system. Each
 * operation is a set of actions, defined by their name's hashes, plus a list of booleans
 * that specify whether the action is optional or not.
 *
 * The local configuration for the operations definitions is in @deploy-configurations/constants/operation-names.ts
 * Each name gives access, through the OperationsDatabase, to the list of actions that are involved and its optional
 * status.
 *
 * The validation process compares the local configuration with the registry's configuration and returns a result
 */
export enum OpValidationResultType {
  /**
   * The operation onchain configuration matches the local configuration
   */
  CONFIGURED,
  /**
   * The given operation name could not be found in the local configuration. This is a very unusal error and
   * it is probably due to human mistake when querying the OperationsDatabase
   */
  OP_UNKNOWN,
  /**
   * The operation is not configured in the onchain registry
   */
  NOT_CONFIGURED,
  /**
   * The operation is currently configured in the onchain registry, but the list of actions or their optionality
   * are different from the local configuration
   */
  ACTION_MISMATCH,
  /**
   * An unknown error has occurred when accessing the OperationsRegistry contracts
   */
  CONTRACT_ERROR,
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
  operationActionsHashes: string[],
  operationIsActionOptional: boolean[],
  actionDefinitions: ActionDefinition[],
  actionsDatabase: ActionsDatabase,
): ActionValidationResult {
  const mismatchedActions: {
    actionIndex: number
    expectedActionNameOrHash: string
    registryActionNameOrHash: string
  }[] = []

  for (let actionIndex = 0; actionIndex < actionDefinitions.length; actionIndex++) {
    if (
      actionDefinitions[actionIndex].hash !== operationActionsHashes[actionIndex] ||
      actionDefinitions[actionIndex].optional !== operationIsActionOptional[actionIndex]
    ) {
      const actionDefinitionName = actionsDatabase.getActionName(
        actionDefinitions[actionIndex].hash,
      )
      const operationHashName = actionsDatabase.getActionName(operationActionsHashes[actionIndex])

      mismatchedActions.push({
        actionIndex,
        expectedActionNameOrHash: actionDefinitionName
          ? actionDefinitionName
          : actionDefinitions[actionIndex].hash,
        registryActionNameOrHash: operationHashName
          ? operationHashName
          : operationActionsHashes[actionIndex],
      })
      break
    }
  }

  if (mismatchedActions.length > 0) {
    let errorMessage =
      'Actions mismatch between local config and registry [(local, in registry)]: ['

    errorMessage = mismatchedActions.reduce(
      (acc, mismatchedAction) =>
        acc +
        `(${mismatchedAction.expectedActionNameOrHash}, ${mismatchedAction.registryActionNameOrHash}),`,
      errorMessage,
    )

    // Remove last commma
    errorMessage = errorMessage.slice(0, -1)
    errorMessage += ']'

    return {
      success: false,
      errorMessage: errorMessage,
    }
  }

  return {
    success: true,
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
