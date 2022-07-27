import BigNumber from 'bignumber.js'

import { CONTRACT_NAMES } from '../constants'
import { calldataTypes } from '../types/actions'
import { ActionCall } from '../types/common'
import { ActionFactory } from '../utils'
import { ServiceRegistry } from '../wrappers/serviceRegistry'

const createAction = ActionFactory.create

export async function openVault(registry: ServiceRegistry, args: { joinAddress: string }) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [args],
  )
}

export async function pullToken(
  registry: ServiceRegistry,
  args: { amount: BigNumber; asset: string; from: string },
) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
    [calldataTypes.common.PullToken],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
        from: args.from,
      },
    ],
  )
}

export async function setApproval(
  registry: ServiceRegistry,
  args: { amount: BigNumber; asset: string; delegator: string },
) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.common.SET_APPROVAL),
    [calldataTypes.common.Approval],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
        delegator: args.delegator,
      },
    ],
  )
}

export async function aaveDeposit(
  registry: ServiceRegistry,
  args: { amount: BigNumber; asset: string },
) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.aave.DEPOSIT),
    [calldataTypes.aave.Deposit],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
      },
    ],
  )
}

export async function aaveBorrow(
  registry: ServiceRegistry,
  args: { amount: BigNumber; asset: string },
) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.aave.BORROW),
    [calldataTypes.aave.Borrow],
    [
      {
        amount: args.amount.toFixed(0),
        asset: args.asset,
      },
    ],
  )
}

export async function aaveWithdraw(
  registry: ServiceRegistry,
  args: { amount: BigNumber; asset: string },
) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.aave.WITHDRAW),
    [calldataTypes.aave.Withdraw],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
      },
    ],
  )
}

export async function swap(
  registry: ServiceRegistry,
  args: {
    fromAsset: string
    toAsset: string
    amount: BigNumber
    receiveAtLeast: BigNumber
    fee: number
    withData: string | number
    collectFeeInFromToken: boolean
  },
) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.common.SWAP_ACTION),
    [calldataTypes.common.Swap],
    [
      {
        fromAsset: args.fromAsset,
        toAsset: args.toAsset,
        amount: args.amount.toFixed(0),
        receiveAtLeast: args.receiveAtLeast.toFixed(0),
        fee: args.fee,
        withData: args.withData,
        collectFeeInFromToken: args.collectFeeInFromToken,
      },
    ],
  )
}

export async function sendToken(
  registry: ServiceRegistry,
  args: { asset: string; to: string; amount: BigNumber },
) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.common.SEND_TOKEN),
    [calldataTypes.common.SendToken],
    [
      {
        asset: args.asset,
        to: args.to,
        amount: args.amount.toFixed(0),
      },
    ],
  )
}

export async function takeAFlashLoan(
  registry: ServiceRegistry,
  args: {
    flashloanAmount: BigNumber
    borrower: string
    dsProxyFlashloan: boolean
    calls: ActionCall[]
  },
) {
  return createAction(
    await registry.getEntryHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    [calldataTypes.common.TakeAFlashLoan],
    [
      {
        amount: args.flashloanAmount.toFixed(0),
        borrower: args.borrower,
        dsProxyFlashloan: args.dsProxyFlashloan,
        calls: args.calls,
      },
    ],
  )
}
