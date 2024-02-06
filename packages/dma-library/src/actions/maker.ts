import { getActionHash } from '@oasisdex/deploy-configurations/utils'

import { ActionCall, calldataTypes } from '../types'
import { ActionFactory } from './action-factory'

const createAction = ActionFactory.create

// Import ActionCall as it assists type generation
export function openVault(args: { joinAddress: string }): ActionCall {
  return createAction(getActionHash('MakerOpenVault'), [calldataTypes.maker.Open], [args])
}
