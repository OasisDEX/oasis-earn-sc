import { CONTRACT_NAMES } from '@dma-deployments/constants'
import { getActionHash } from '@dma-deployments/utils/action-hash'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { ActionCall, calldataTypes } from '@dma-library/types'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

export function aaveDeposit(
  args: { asset: string; amount: BigNumber | 0; sumAmounts: boolean; setAsCollateral?: boolean },
  paramsMapping: [asset: number, amount: number, sumAmounts: number, setAsCollateral: number] = [
    0, 0, 0, 0,
  ],
  // Import ActionCall as it assists type generation
): ActionCall {
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

// Import ActionCall as it assists type generation
export function aaveBorrow(args: { amount: BigNumber; asset: string; to: string }): ActionCall {
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

// Import ActionCall as it assists type generation
export function aaveWithdraw(args: { amount: BigNumber; asset: string; to: string }): ActionCall {
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

// Import ActionCall as it assists type generation
export function aavePayback(
  args: { asset: string; amount: BigNumber; paybackAll: boolean },
  paramsMapping: [asset: number, amount: number, paybackAll: number] = [0, 0, 0],
): ActionCall {
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
