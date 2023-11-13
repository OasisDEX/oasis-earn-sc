import { OperationNames } from '@deploy-configurations/constants'
import { Protocol, ProtocolNames } from '@deploy-configurations/types/protocol'
import { IOperation } from '@dma-library/types'

import { refinanceSwap_calls } from './common/refinance-swap.calls'
import {
  RefinanceOperationArgs,
  RefinanceOperationsMap,
  RefinancePartialOperation,
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
  opGenerator: RefinancePartialOperation,
): void {
  RefinanceOperations[protocol] = { ...RefinanceOperations[protocol], [opType]: opGenerator }
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
  const protocolFromCallsGetter = RefinanceOperations[protocolFrom]?.Close
  const swapOperationsCallsGetter = refinanceSwap_calls
  const protocolToOperationsCallsGetter = RefinanceOperations[protocolTo]?.Open

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
