import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { ActionCall, calldataTypes } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { ActionFactory } from './action-factory'

const createAction = ActionFactory.create

export function pullToken(
  network: Network,
  args: { amount: BigNumber; asset: string; from: string },
) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.PULL_TOKEN),
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
  network: Network,
  args: { amount: BigNumber | 0; asset: string; delegate: string; sumAmounts: boolean },
  paramsMapping: [asset: number, delegate: number, amount: number, sumAmounts: number] = [
    0, 0, 0, 0,
  ],
) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.SET_APPROVAL),
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

export function swap(
  network: Network,
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
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)
  console.log(`Swap service registry names: ${SERVICE_REGISTRY_NAMES.common.SWAP_ACTION}`)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.SWAP_ACTION),
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

export function sendToken(
  network: Network,
  args: { asset: string; to: string; amount: BigNumber },
  paramsMapping: [asset: number, to: number, amount: number] = [0, 0, 0],
) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.SEND_TOKEN),
    [calldataTypes.common.SendToken],
    [
      {
        asset: args.asset,
        to: args.to,
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

export function takeAFlashLoan(
  network: Network,
  args: {
    flashloanAmount: BigNumber
    asset: string
    isProxyFlashloan: boolean
    isDPMProxy: boolean
    provider: number
    calls: ActionCall[]
  },
) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN),
    [calldataTypes.common.TakeAFlashLoan],
    [
      {
        amount: args.flashloanAmount.toFixed(0),
        asset: args.asset,
        isProxyFlashloan: args.isProxyFlashloan,
        isDPMProxy: args.isDPMProxy,
        provider: args.provider,
        calls: args.calls,
      },
    ],
  )
}

export function wrapEth(
  network: Network,
  args: { amount: BigNumber | 0 },
  paramsMapping: [amount: number] = [0],
) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.WRAP_ETH),
    [calldataTypes.common.WrapEth],
    [
      {
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

export function unwrapEth(
  network: Network,
  args: { amount: BigNumber | 0 },
  paramsMapping: [amount: number] = [0],
) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH),
    [calldataTypes.common.UnwrapEth],
    [
      {
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

export function returnFunds(network: Network, args: { asset: string }) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS),
    [calldataTypes.common.ReturnFunds],
    [
      {
        asset: args.asset,
      },
    ],
  )
}

export function positionCreated(
  network: Network,
  args: {
    protocol: string
    positionType: string
    collateralToken: string
    debtToken: string
  },
) {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.common.POSITION_CREATED),
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
