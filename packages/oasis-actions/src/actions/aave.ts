import BigNumber from 'bignumber.js'

import { CONTRACT_NAMES } from '../helpers/constants'
import { ActionFactory } from './actionFactory'
import { getActionHash } from './getActionHash'
import { calldataTypes } from './types/actions'

const createAction = ActionFactory.create

export function aaveDeposit(
  args: { amount: BigNumber | 0; asset: string },
  paramsMapping: [asset: number, amount: number] = [0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.DEPOSIT),
    [calldataTypes.aave.Deposit],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

export function aaveBorrow(args: { amount: BigNumber; asset: string, to: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.BORROW),
    [calldataTypes.aave.Borrow],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
        to: args.to,
      },
    ],
  )
}

export function aaveWithdraw(args: { amount: BigNumber; asset: string, to: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.WITHDRAW),
    [calldataTypes.aave.Withdraw],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        to: args.to
      },
    ],
  )
}
