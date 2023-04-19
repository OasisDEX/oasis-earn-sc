import { CONTRACT_NAMES } from '@oasisdex/dma-deployments/constants/contract-names'
import { getActionHash } from '@oasisdex/dma-deployments/utils/action-hash'

import { calldataTypes } from '../types'
import { ActionFactory } from './action-factory'

const createAction = ActionFactory.create

export function openVault(args: { joinAddress: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [args],
  )
}
