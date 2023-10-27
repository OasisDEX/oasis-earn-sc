import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { ActionCall, calldataTypes, MorphoBlueMarket } from '@dma-library/types'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

// Import ActionCall as it assists type generation
export function morphoBlueDeposit(
  network: Network,
  args: { morphoBlueMarket: MorphoBlueMarket; amount: BigNumber | 0; sumAmounts: boolean },
  paramsMapping: [amount: number, sumAmounts: number] = [0, 0],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.morphoblue.DEPOSIT),
    [calldataTypes.morphoblue.Deposit],
    [
      {
        morphoBlueMarket: args.morphoBlueMarket,
        amount: args.amount.toFixed(0),
        sumAmounts: args.sumAmounts,
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function morphoBlueBorrow(
  network: Network,
  args: { morphoBlueMarket: MorphoBlueMarket; amount: BigNumber },
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.morphoblue.BORROW),
    [calldataTypes.morphoblue.Borrow],
    [
      {
        morphoBlueMarket: args.morphoBlueMarket,
        amount: args.amount.toFixed(0),
      },
    ],
  )
}

// Import ActionCall as it assists type generation
export function morphoBlueWithdraw(
  network: Network,
  args: { morphoBlueMarket: MorphoBlueMarket; amount: BigNumber; to: string },
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.morphoblue.WITHDRAW),
    [calldataTypes.morphoblue.Withdraw],
    [
      {
        morphoBlueMarket: args.morphoBlueMarket,
        amount: args.amount.toFixed(0),
        to: args.to,
      },
    ],
  )
}

// Import ActionCall as it assists type generation
export function morphoBluePayback(
  network: Network,
  args: { morphoBlueMarket: MorphoBlueMarket; amount: BigNumber; paybackAll: boolean },
  paramsMapping: [amount: number, paybackAll: number] = [0, 0],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.morphoblue.PAYBACK),
    [calldataTypes.morphoblue.Payback],
    [
      {
        morphoBlueMarket: args.morphoBlueMarket,
        amount: args.amount.toFixed(0),
        paybackAll: args.paybackAll,
      },
      paramsMapping,
    ],
  )
}
