import BigNumber from 'bignumber.js'

import { CONTRACT_NAMES } from '../constants'
import { calldataTypes } from '../types/actions'
import { ActionFactory } from '../utils'
import { getActionHash } from './getActionHash'

const createAction = ActionFactory.create

export async function aaveDeposit(args: { amount: BigNumber; asset: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.DEPOSIT),
    [calldataTypes.aave.Deposit],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
      },
    ],
  )
}

export async function aaveBorrow(args: { amount: BigNumber; asset: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.BORROW),
    [calldataTypes.aave.Borrow],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
      },
    ],
  )
}

export async function aaveWithdraw(args: { amount: BigNumber; asset: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.WITHDRAW),
    [calldataTypes.aave.Withdraw],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
      },
    ],
  )
}
