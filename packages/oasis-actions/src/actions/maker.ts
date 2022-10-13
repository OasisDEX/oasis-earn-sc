import BigNumber from 'bignumber.js'

import { CONTRACT_NAMES } from '../helpers/constants'
import { ActionFactory } from './actionFactory'
import { getActionHash } from './getActionHash'
import { calldataTypes } from './types/actions'

const createAction = ActionFactory.create

export function openVault(args: { joinAddress: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [args],
  )
}

/*
  Maker payback
  Read:
    -vaultId
  Write:
    - paybackAmount
*/
export function payback(
  args: { vaultId: BigNumber | 0; userAddress: string; amount: BigNumber },
  paramsMapping: [vaultId: number, userAddress: 0, amount: 0, paybackAll: 0] = [0, 0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.PAYBACK),
    [calldataTypes.maker.Payback, calldataTypes.paramsMap],
    [
      {
        vaultId: args.vaultId.toString(),
        userAddress: args.userAddress,
        amount: args.amount.toString(),
        paybackAll: args.amount.eq(0),
      },
      paramsMapping,
    ],
  )
}

/*
  Maker withdraw
  Read:
    - vaultId
  Write:
    - withdrawAmount
*/
export function withdraw(
  args: {
    vaultId: BigNumber | 0
    // userAddress where to withdraw eth, other tokens will be withdrawn to proxy 🤔
    userAddress: string
    joinAddress: string
    amount: BigNumber
  },
  paramsMapping: [vaultId: number, userAddress: 0, joinAddress: 0, amount: 0] = [0, 0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.WITHDRAW),
    [calldataTypes.maker.Withdraw, calldataTypes.paramsMap],
    [
      {
        vaultId: args.vaultId.toString(),
        userAddress: args.userAddress,
        joinAddr: args.joinAddress,
        amount: args.amount.toString(),
      },
      paramsMapping,
    ],
  )
}

/*
  Maker deposit
  Read:
    - vaultId
    - amount
  Write:
    - depositAmount
*/
export function deposit(
  args: { joinAddress: string; vaultId: BigNumber | 0; amount: BigNumber | 0 },
  paramsMapping: [joinAddress: 0, vaultId: number, amount: number] = [0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.DEPOSIT),
    [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
    [
      {
        joinAddress: args.joinAddress,
        vaultId: args.vaultId.toString(),
        amount: args.amount.toString(),
      },
      paramsMapping,
    ],
  )
}

/*
  Maker generate
  Read:
    - vaultId
    - amount
  Write:
    - generatedAmount
*/
export function generate(
  args: { to: string; vaultId: BigNumber | 0; amount: BigNumber | 0 },
  paramsMapping: [to: 0, vaultId: number, amount: number] = [0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.maker.GENERATE),
    [calldataTypes.maker.Generate, calldataTypes.paramsMap],
    [
      {
        to: args.to,
        vaultId: args.vaultId.toString(),
        amount: args.amount.toString(),
      },
      paramsMapping,
    ],
  )
}
