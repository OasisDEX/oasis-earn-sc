import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'

/**
 * Creates a reallocate action for the MorphoBlue protocol.
 * 
 * @param network - The network on which the action is being executed.
 * @param reallocateData - An array of strings containing data for reallocation.
 * 
 * If the reallocateData array is empty, the action will be marked as skipped.
 * This allows for conditional execution based on the presence of reallocation data.
 * 
 * @returns The reallocate action object, which may be skipped if no data is provided.
 */
export function getReallocateToAction(network: Network, reallocateData: string[]) {
    const reallocateAction = actions.morphoblue.reallocate(network, {
        data: reallocateData,
    })
    if (reallocateData.length === 0) {
        reallocateAction.skipped = true
    }
    return reallocateAction
}
