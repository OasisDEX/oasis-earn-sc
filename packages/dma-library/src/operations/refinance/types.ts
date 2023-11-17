import { ActionCall, Protocol } from '@dma-library/types'
import {
  WithAaveLikeStrategyAddresses,
  WithFlashloanProvider,
  WithNetwork,
  WithNewPosition,
  WithOptionalActionCalls,
  WithPaybackAll,
  WithPositionStatus,
  WithProxy,
  WithStorageIndex,
  WithSwap,
  WithWithdrawAll,
} from '@dma-library/types/operations'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'

/**
 * Refinance operation arguments
 *
 * @dev This type contains all the arguments needed to perform a refinance operation in any of
 * the protocols supported by the library. Some arguments may not be used in the underlying function
 * but this allows for consistency across all the protocols.
 *
 * @dev If a new argument is needed for a specific protocol, it should be added to this type and
 * then used in the specific protocol function.
 */
export type RefinanceOperationArgs = WithStorageIndex &
  WithProxy &
  WithPositionStatus &
  WithNewPosition &
  WithFlashloanProvider &
  WithSwap &
  WithPaybackAll &
  WithWithdrawAll &
  WithAaveLikeStrategyAddresses &
  WithNetwork &
  WithOptionalActionCalls

/**
 * Refinance operation return type
 *
 * @dev This type allows for composition of refinance operations. It contains the calls that
 * must be executed for the specific operation and the last storage index used. This last index
 * is used to track the storage used by the partial operation so the next partial operation
 * in chain can use the next index.
 */
export type RefinancePartialOperationReturn = {
  calls: ActionCall[]
  lastStorageIndex: number
}

/**
 * Refinance operation function type
 *
 * @dev All the operations in the refinance library must have this type. This way they can
 */
export type RefinancePartialOperationGenerator = (
  args: RefinanceOperationArgs,
) => Promise<RefinancePartialOperationReturn>

/**
 * Refinance partial operation type
 *
 * @dev These are the types of partial operations that can be used to compose a refinance operation.
 * Typically a Refinance operation will be composed of a sequence of partial operations:
 *   - Close
 *   - Open
 */
export enum RefinancePartialOperationType {
  Flashloan = 'Flashloan',
  Close = 'Close',
  Open = 'Open',
}

/**
 * Refinance operations map
 *
 * @dev The map contains the partial operations that can be used to compose a refinance operation.
 * It is indexed first by the protocol that the partial operation is for and then by the type of
 * partial operation.
 */
export type RefinancePartialOperation = {
  definition: ActionPathDefinition[]
  generator: RefinancePartialOperationGenerator
}

export type RefinanceProtocolOperationsMap = Partial<
  Record<RefinancePartialOperationType, RefinancePartialOperation>
>

export type RefinanceOperationsMap = Partial<Record<Protocol, RefinanceProtocolOperationsMap>>

/**
 * Operation definition that can be used to populate the operations registry
 */
export type ExtendedActionDefinition = {
  name: string
  serviceNamePath: string
  hash: string
  optional: boolean
}

export type ExtendedOperationDefinition = {
  name: string
  actions: ExtendedActionDefinition[]
}

export type ExtendedOperationDefinitionMaybe = ExtendedOperationDefinition | undefined
