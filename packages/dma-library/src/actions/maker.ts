import { CONTRACT_NAMES } from '@deploy-configurations/constants'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { ActionCall, calldataTypes } from '@dma-library/types'

import { ActionFactory } from './action-factory'

const createAction = ActionFactory.create

// Import ActionCall as it assists type generation
export function openVault(args: { joinAddress: string }): ActionCall {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [args],
  )
}
