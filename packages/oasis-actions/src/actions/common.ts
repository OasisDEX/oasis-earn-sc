import BigNumber from 'bignumber.js'

import { CONTRACT_NAMES } from '../helpers/constants'
import { ActionFactory } from './actionFactory'
import { getActionHash } from './getActionHash'
import { ActionCall } from './types/actionCall'
import { calldataTypes } from './types/actions'

const createAction = ActionFactory.create

export function pullToken(args: { amount: BigNumber; asset: string; from: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.PULL_TOKEN),
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

export function setApproval(
  args: { amount: BigNumber | 0; asset: string; delegate: string; sumAmounts: boolean },
  paramsMapping: [asset: number, delegate: number, amount: number, sumAmounts: number] = [
    0, 0, 0, 0,
  ],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.SET_APPROVAL),
    [calldataTypes.common.Approval],
    [
      {
        asset: args.asset,
        delegate: args.delegate,
        amount: args.amount.toFixed(0),
        sumAmounts: args.sumAmounts,
      },
      paramsMapping,
    ],
  )
}

export function swap(args: {
  fromAsset: string
  toAsset: string
  amount: BigNumber
  receiveAtLeast: BigNumber
  fee: number
  withData: string | number
  collectFeeInFromToken: boolean
}) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.SWAP_ACTION),
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

export function sendToken(args: { asset: string; to: string; amount: BigNumber }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.SEND_TOKEN),
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

export function takeAFlashLoan(args: {
  flashloanAmount: BigNumber
  borrower: string
  isProxyFlashloan: boolean
  isDPMProxy: boolean
  calls: ActionCall[]
}) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    [calldataTypes.common.TakeAFlashLoan],
    [
      {
        amount: args.flashloanAmount.toFixed(0),
        borrower: args.borrower,
        isProxyFlashloan: args.isProxyFlashloan,
        isDPMProxy: args.isDPMProxy,
        calls: args.calls,
      },
    ],
  )
}

export function wrapEth(args: { amount: BigNumber | 0 }, paramsMapping: [amount: number] = [0]) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.WRAP_ETH),
    [calldataTypes.common.WrapEth],
    [
      {
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

export function unwrapEth(args: { amount: BigNumber | 0 }, paramsMapping: [amount: number] = [0]) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.UNWRAP_ETH),
    [calldataTypes.common.UnwrapEth],
    [
      {
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

export function returnFunds(args: { asset: string }) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.RETURN_FUNDS),
    [calldataTypes.common.ReturnFunds],
    [
      {
        asset: args.asset,
      },
    ],
  )
}

export function positionCreated(args: {
  protocol: string
  positionType: string
  collateralToken: string
  debtToken: string
}) {
  return createAction(
    getActionHash(CONTRACT_NAMES.common.POSITION_CREATED),
    [calldataTypes.common.PositionCreated],
    [
      {
        protocol: args.protocol,
        positionType: args.positionType,
        collateralToken: args.collateralToken,
        debtToken: args.debtToken,
      },
    ],
  )
}