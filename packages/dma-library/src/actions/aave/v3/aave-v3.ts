import { ActionFactory } from '@dma-library/actions/action-factory'
import { calldataTypes } from '@dma-library/types'
import { CONTRACT_NAMES } from '@oasisdex/dma-deployments/constants'
import { getActionHash } from '@oasisdex/dma-deployments/utils/action-hash'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

export function aaveV3Deposit(
  args: { asset: string; amount: BigNumber | 0; sumAmounts: boolean; setAsCollateral?: boolean },
  paramsMapping: [asset: number, amount: number, sumAmounts: number, setAsCollateral: number] = [
    0, 0, 0, 0,
  ],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.v3.DEPOSIT),
    [calldataTypes.aaveV3.Deposit],
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

export function aaveV3Borrow(args: { amount: BigNumber; asset: string; to: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.v3.BORROW),
    [calldataTypes.aaveV3.Borrow],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
        to: args.to,
      },
    ],
  )
}

export function aaveV3Withdraw(args: { amount: BigNumber; asset: string; to: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.v3.WITHDRAW),
    [calldataTypes.aaveV3.Withdraw],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        to: args.to,
      },
    ],
  )
}

export function aaveV3Payback(
  args: { asset: string; amount: BigNumber; paybackAll: boolean },
  paramsMapping: [asset: number, amount: number, paybackAll: number] = [0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.v3.PAYBACK),
    [calldataTypes.aaveV3.Payback],
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

export function aaveV3SetEMode(args: { categoryId: number }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.aave.v3.SET_EMODE),
    [calldataTypes.aaveV3.SetEMode],
    [
      {
        categoryId: args.categoryId,
      },
    ],
  )
}
