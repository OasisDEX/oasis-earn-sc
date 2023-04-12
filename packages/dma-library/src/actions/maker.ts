import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants/contract-names'

import { calldataTypes } from '../types'
import { ActionFactory } from './action-factory'
import { getActionHash } from './get-action-hash'

const createAction = ActionFactory.create

export function openVault(args: { joinAddress: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [args],
  )
}
