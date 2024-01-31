import OperationsRegistryInterface from '@abis/system/contracts/core/OperationsRegistry.sol/OperationsRegistry.json'
import * as OperationGetters from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { ethers, utils } from 'ethers'

import { ActionDefinition } from './verification-utils'

export type OperationDefinition = {
  name: string
  actions: ActionDefinition[]
}

type Action = {
  hash: string
  optional?: boolean
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

  public getTuple(opName: string): string | undefined {
    const op = this.getDefinition(opName)
    if (!op) {
      return undefined
    }

    return JSON.stringify([this.calculateActionsHash(op.actions), op.name])
  }

  public getCalldataTuple(opName: string): any[] | undefined {
    const op = this.getDefinition(opName)
    if (!op) {
      return undefined
    }

    return [op.name, this.calculateActionsHash(op.actions)]
  }

  public calculateActionsHash(actions: Action[]): string {
    const actionHashes = actions.map(a => a.hash)
    const concatenatedHashes = utils.solidityPack(['bytes32[]'], [actionHashes])
    return utils.keccak256(concatenatedHashes)
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
      const parameters = this.getCalldataTuple(operationDefinition.name)

      const calldata = operationsRegistryIface.encodeFunctionData('addOperation', parameters)

      this.opNameToCalldata[operationDefinition.name] = calldata
    })
  }
}
