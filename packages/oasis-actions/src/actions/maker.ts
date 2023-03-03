import { CONTRACT_NAMES } from '../helpers/constants'
import { calldataTypes } from '../types'
import { ActionFactory } from './actionFactory'
import { getActionHash } from './getActionHash'

const createAction = ActionFactory.create

export function openVault(args: { joinAddress: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [args],
  )
}
