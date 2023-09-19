import * as OperationGetters from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'

import { ActionDefinition } from './verification-utils'

export type OperationDefinition = {
  name: string
  actions: ActionDefinition[]
}

export type OperationDefinitionMaybe = OperationDefinition | undefined

export type OperationDefinitionGetter = (string) => OperationDefinition

export class OperationsDatabase {
  private readonly opNameToDefinition: { [key: string]: OperationDefinition } = {}

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

    return JSON.stringify([
      op.actions.map(op => op.hash),
      op.actions.map(op => op.optional),
      op.name,
    ])
  }

  public getOperationNames(): string[] {
    return Object.keys(this.opNameToDefinition)
  }

  private buildDatabase(network: Network) {
    const operationDefinitions: OperationDefinition[] = Object.keys(OperationGetters).map(key =>
      (OperationGetters as unknown as OperationDefinitionGetter[])[key](network),
    )

    operationDefinitions.forEach(operationDefinition => {
      this.opNameToDefinition[operationDefinition.name] = operationDefinition
    })
  }
}
