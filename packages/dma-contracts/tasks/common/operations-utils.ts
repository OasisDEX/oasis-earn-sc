import OperationsRegistryInterface from '@abis/system/contracts/core/OperationsRegistry.sol/OperationsRegistry.json'
import * as OperationGetters from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { ethers } from 'ethers'

import { ActionDefinition } from './verification-utils'

export type OperationDefinition = {
  name: string
  actions: ActionDefinition[]
}

export type OperationDefinitionMaybe = OperationDefinition | undefined

export type OperationDefinitionGetter = (string) => OperationDefinition

export class OperationsDatabase {
  private readonly opNameToDefinition: { [key: string]: OperationDefinition } = {}
  private readonly opNameToCalldata: { [key: string]: string } = {}

  constructor(network: Network) {
    this.buildDatabase(network)
  }

  public getDefinition(opName: string): OperationDefinition | undefined {
    if (opName in this.opNameToDefinition) {
      return this.opNameToDefinition[opName]
    } else {
      return undefined
    }
  }

  public getOpHash(opName: string): string | undefined {
    const op = this.getDefinition(opName)
    if (!op) {
      return undefined
    }

    const hashes = op.actions.map(op => op.hash)
    console.log('Action hashes', hashes)
    const operationHash = ethers.utils.solidityKeccak256(['bytes32[]'], [hashes])

    return operationHash
  }

  public getOperationNames(): string[] {
    return Object.keys(this.opNameToDefinition)
  }

  public findByCallData(calldata: string): OperationDefinitionMaybe {
    const opName = Object.keys(this.opNameToCalldata).find(
      key => this.opNameToCalldata[key] === calldata,
    )
    if (!opName) {
      return undefined
    }
    return this.getDefinition(opName)
  }

  private buildDatabase(network: Network) {
    const operationDefinitions: OperationDefinition[] = Object.keys(OperationGetters).map(key =>
      (OperationGetters as unknown as OperationDefinitionGetter[])[key](network),
    )

    operationDefinitions.forEach(operationDefinition => {
      this.opNameToDefinition[operationDefinition.name] = operationDefinition
    })

    const operationsRegistryIface = new ethers.utils.Interface(OperationsRegistryInterface)

    operationDefinitions.forEach(operationDefinition => {
      const opHash = this.getOpHash(operationDefinition.name)

      const calldata = operationsRegistryIface.encodeFunctionData('addOperation', [
        operationDefinition.name,
        opHash,
      ])

      this.opNameToCalldata[operationDefinition.name] = calldata
    })
  }
}
