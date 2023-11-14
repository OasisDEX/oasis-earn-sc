import { OperationNames } from '@deploy-configurations/constants'
import { Protocol, ProtocolNames } from '@deploy-configurations/types/protocol'
import { IOperation } from '@dma-library/types'
import {
  ActionPathDefinition,
  OperationPathsDefinition,
} from '@dma-library/types/operations-definition'

import { refinanceSwap_calls, refinanceSwap_definition } from './common/refinance-swap.calls'
import {
  RefinanceOperationArgs,
  RefinanceOperationsMap,
  RefinancePartialOperationGenerator,
  RefinancePartialOperationType,
} from './types'

/**
 * Refinance operations map
 *
 * @dev The map `RefinanceOperations` must be populated from the different partial operations
 * implementations that reside in the `operations/refinance/<protocol>` folders.
 */
export const RefinanceOperations: RefinanceOperationsMap = {}

/**
 * Function used to register a refinance partial operation. Each partial operation implementation
 * must call this function to register itself.
 *
 * @param protocol The protocol that the partial operation is for
 * @param opType The type of partial operation
 * @param opCalls The partial operation implementation plus the last storage index used
 */
export function registerRefinanceOperation(
  protocol: Protocol,
  opType: RefinancePartialOperationType,
  opGenerator: RefinancePartialOperationGenerator,
  opDefinition: ActionPathDefinition[],
): void {
  RefinanceOperations[protocol] = {
    ...RefinanceOperations[protocol],
    [opType]: {
      generator: opGenerator,
      definition: opDefinition,
    },
  }
}

/**
 * Retrieves a refinance operation for the given pair of protocols
 *
 * @param protocolFrom The protocol that the refinance operation is closing
 * @param protocolTo The protocol that the refinance operation is opening
 *
 * @returns The refinance operation or undefined if it is not defined
 */
export async function getRefinanceOperation(
  protocolFrom: Protocol,
  protocolTo: Protocol,
  args: RefinanceOperationArgs,
): Promise<IOperation | undefined> {
  const protocolFromCallsGetter = RefinanceOperations[protocolFrom]?.Close?.generator
  const swapOperationsCallsGetter = refinanceSwap_calls
  const protocolToOperationsCallsGetter = RefinanceOperations[protocolTo]?.Open?.generator

  if (!protocolFromCallsGetter || !swapOperationsCallsGetter || !protocolToOperationsCallsGetter) {
    return undefined
  }

  const protocolFromCalls = (await protocolFromCallsGetter(args)).calls
  const swapOperationsCalls = (await swapOperationsCallsGetter(args)).calls
  const protocolToOperationsCalls = (await protocolToOperationsCallsGetter(args)).calls

  return {
    calls: [...protocolFromCalls, ...swapOperationsCalls, ...protocolToOperationsCalls],
    operationName: getRefinanceOperationName(protocolFrom, protocolTo),
  }
}

/**
 * Returns the name of the refinance operation for the given pair of protocols
 *
 * @param protocolFrom The protocol that the refinance operation is closing
 * @param protocolTo The protocol that the refinance operation is opening
 *
 * @returns The name of the refinance operation
 */
export function getRefinanceOperationName(
  protocolFrom: Protocol,
  protocolTo: Protocol,
): OperationNames {
  return `Refinance-${protocolFrom}-${protocolTo}`
}

/**
 * Returns all defined refinance operations names
 *
 * @returns An array of refinance operations names
 */
export function getAvailableRefinanceOperationsNames(): OperationNames[] | undefined {
  return ProtocolNames.reduce((acc, protocolFrom) => {
    return ProtocolNames.reduce((acc, protocolTo) => {
      if (
        RefinanceOperations[protocolFrom] &&
        RefinanceOperations[protocolTo] &&
        RefinanceOperations[protocolFrom as string][RefinancePartialOperationType.Close] &&
        RefinanceOperations[protocolTo as string][RefinancePartialOperationType.Open]
      ) {
        acc.push(getRefinanceOperationName(protocolFrom, protocolTo))
      }
      return acc
    }, acc as OperationNames[])
  }, [] as OperationNames[])
}

/**
 * Returns the operation definition for the given pair of protocols
 *
 * @returns The operation definition or undefined if it is not defined
 */
export function getRefinanceOperationDefinition(
  protocolFrom: Protocol,
  protocolTo: Protocol,
): OperationPathsDefinition | undefined {
  const protocolFromDefinition = RefinanceOperations[protocolFrom]?.Close?.definition
  const swapOperationsDefinition = refinanceSwap_definition
  const protocolToOperationsDefinition = RefinanceOperations[protocolTo]?.Open?.definition

  if (!protocolFromDefinition || !swapOperationsDefinition || !protocolToOperationsDefinition) {
    return undefined
  }

  return {
    name: getRefinanceOperationName(protocolFrom, protocolTo),
    actions: [
      ...protocolFromDefinition,
      ...swapOperationsDefinition,
      ...protocolToOperationsDefinition,
    ],
  }
}
