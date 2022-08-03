import { CONTRACT_NAMES } from '../constants'
import { calldataTypes } from '../types/actions'
import { ActionFactory } from '../utils'
import { getActionHash } from './getActionHash'

const createAction = ActionFactory.create

export async function openVault(args: { joinAddress: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [args],
  )
}
