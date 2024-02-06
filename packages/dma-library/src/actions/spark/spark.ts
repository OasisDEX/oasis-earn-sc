import { loadContractNames } from '@oasisdex/deploy-configurations/constants'
import { Network } from '@oasisdex/deploy-configurations/types'
import { getActionHash } from '@oasisdex/deploy-configurations/utils'
import BigNumber from 'bignumber.js'

import { ActionCall, calldataTypes } from '../../types'
import { ActionFactory } from '../action-factory'

const createAction = ActionFactory.create

// Import ActionCall as it assists type generation
export function sparkDeposit(
  network: Network,
  args: { asset: string; amount: BigNumber | 0; sumAmounts: boolean; setAsCollateral?: boolean },
  paramsMapping: [asset: number, amount: number, sumAmounts: number, setAsCollateral: number] = [
    0, 0, 0, 0,
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.spark.DEPOSIT),
    [calldataTypes.spark.Deposit],
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
export function sparkBorrow(
  network: Network,
  args: { amount: BigNumber; asset: string; to: string },
  paramsMapping: [amount: number, asset: number, to: number] = [0, 0, 0],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.spark.BORROW),
    [calldataTypes.spark.Borrow],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
        to: args.to,
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function sparkWithdraw(
  network: Network,
  args: { amount: BigNumber; asset: string; to: string },
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.spark.WITHDRAW),
    [calldataTypes.spark.Withdraw],
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
export function sparkPayback(
  network: Network,
  args: { asset: string; amount: BigNumber; paybackAll: boolean; onBehalfOf: string },
  paramsMapping: [asset: number, amount: number, paybackAll: number, onBehalfOf: number] = [
    0, 0, 0, 0,
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.spark.PAYBACK),
    [calldataTypes.spark.Payback],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        paybackAll: args.paybackAll,
        onBehalfOf: args.onBehalfOf,
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function sparkSetEMode(network: Network, args: { categoryId: number }): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.spark.SET_EMODE),
    [calldataTypes.spark.SetEMode],
    [
      {
        categoryId: args.categoryId,
      },
    ],
  )
}
