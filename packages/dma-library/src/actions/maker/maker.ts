import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { ActionCall, calldataTypes } from '@dma-library/types'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

// Import ActionCall as it assists type generation
export function makerOpen(
  network: Network,
  args: { joinAddress: string; },
  paramsMapping: [joinAddress: number] = [
    0,
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.maker.OPEN_VAULT),
    [calldataTypes.maker.Open],
    [
      {
        joinAddress: args.joinAddress,
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function makerDeposit(
  network: Network,
  args: { joinAddress: string; vaultId: number, amount: BigNumber },
  paramsMapping: [joinAddress: number, vaultId: number, amount: number] = [
    0, 1, 0
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.maker.DEPOSIT),
    [calldataTypes.maker.Deposit],
    [
      {
        joinAddress: args.joinAddress,
        vaultId: args.vaultId,
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function makerGenerate(
  network: Network,
  args: { to: string; vaultId: number; amount: BigNumber },
  paramsMapping: [to: number, vaultId: number, amount: number] = [
    0, 1, 0
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.maker.GENERATE),
    [calldataTypes.maker.Generate],
    [
      {
        to: args.to,
        vaultId: args.vaultId,
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function makerPayback(
  network: Network,
  args: { vaultId: number; userAddress: string, daiJoin: string, amount: BigNumber, paybackAll: boolean },
  paramsMapping: [vaultId: number, userAddress: number, daiJoin: number, amount: number, paybackAll: number] = [
    1, 0, 0, 0, 0
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.maker.PAYBACK),
    [calldataTypes.maker.Payback],
    [
      {
        vaultId: args.vaultId,
        userAddress: args.userAddress,
        daiJoin: args.daiJoin,
        amount: args.amount.toFixed(0),
        paybackAll: args.paybackAll,
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function makerWithdraw(
  network: Network,
  args: { vaultId: number; userAddress: string, joinAddr: string, amount: BigNumber },
  paramsMapping: [vaultId: number, userAddress: number, joinAddr: number, amount: number] = [
    1, 0, 0, 0
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.maker.WITHDRAW),
    [calldataTypes.maker.Withdraw],
    [
      {
        vaultId: args.vaultId,
        userAddress: args.userAddress,
        joinAddr: args.joinAddr,
        amount: args.amount.toFixed(0),
      },
      paramsMapping,
    ],
  )
}


// Import ActionCall as it assists type generation
export function makerGive(
  network: Network,
  args: { to: string; vaultId: number },
  paramsMapping: [to: number, vaultId: number] = [
    0, 0,
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)
  
  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.maker.GIVE),
    [calldataTypes.maker.Give],
    [
      {
        to: args.to,
        vaultId: args.vaultId,
      },
      paramsMapping,
    ],
  )
}