import { CONTRACT_NAMES } from '@dma-deployments/constants'
import { getActionHash } from '@dma-deployments/utils/action-hash'
import { calldataTypes } from '@dma-library/types'

import { ActionFactory } from './action-factory'

const createAction = ActionFactory.create

export function openVault(args: { joinAddress: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [args],
  )
}
