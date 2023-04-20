import { ActionFactory } from '@dma-library/actions/action-factory'
import { calldataTypes } from '@dma-library/types'
import { CONTRACT_NAMES } from '@oasisdex/dma-deployments/constants'
import { getActionHash } from '@oasisdex/dma-deployments/utils/action-hash'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

export function aaveDeposit(
  args: { asset: string; amount: BigNumber | 0; sumAmounts: boolean; setAsCollateral?: boolean },
  paramsMapping: [asset: number, amount: number, sumAmounts: number, setAsCollateral: number] = [
    0, 0, 0, 0,
  ],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.v2.DEPOSIT),
    [calldataTypes.aave.Deposit],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        sumAmounts: args.sumAmounts,
        setAsCollateral: args.setAsCollateral === undefined ? true : args.setAsCollateral,
      },
      paramsMapping,
    ],
  )
}

export function aaveBorrow(args: { amount: BigNumber; asset: string; to: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.v2.BORROW),
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
    getActionHash(CONTRACT_NAMES.aave.v2.WITHDRAW),
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
    getActionHash(CONTRACT_NAMES.aave.v2.PAYBACK),
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
