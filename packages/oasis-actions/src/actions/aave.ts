import BigNumber from 'bignumber.js'

import { CONTRACT_NAMES } from '../helpers/constants'
import { ActionFactory } from './actionFactory'
import { getActionHash } from './getActionHash'
import { calldataTypes } from './types/actions'

const createAction = ActionFactory.create

export function aaveDeposit(
  args: { asset: string; amount: BigNumber | 0; sumAmounts: boolean },
  paramsMapping: [asset: number, amount: number, sumAmounts: number] = [0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.DEPOSIT),
    [calldataTypes.aave.Deposit],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        sumAmounts: args.sumAmounts,
      },
      paramsMapping,
    ],
  )
}

export function aaveBorrow(args: { amount: BigNumber; asset: string; to: string }) {
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

export function aaveWithdraw(args: { amount: BigNumber; asset: string; to: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.WITHDRAW),
    [calldataTypes.aave.Withdraw],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        to: args.to,
      },
    ],
  )
}

export function aavePayback(
  args: { asset: string; amount: BigNumber; paybackAll: boolean },
  paramsMapping: [asset: number, amount: number, paybackAll: number] = [0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.PAYBACK),
    [calldataTypes.aave.Payback],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        paybackAll: args.paybackAll,
      },
      paramsMapping,
    ],
  )
}
