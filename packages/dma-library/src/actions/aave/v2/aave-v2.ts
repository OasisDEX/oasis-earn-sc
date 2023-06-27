import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { ActionCall, calldataTypes } from '@dma-library/types'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

export function aaveDeposit(
  network: Network,
  args: { asset: string; amount: BigNumber | 0; sumAmounts: boolean; setAsCollateral?: boolean },
  paramsMapping: [asset: number, amount: number, sumAmounts: number, setAsCollateral: number] = [
    0, 0, 0, 0,
  ],
  // Import ActionCall as it assists type generation
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v2.DEPOSIT),
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
export function aaveBorrow(
  network: Network,
  args: { amount: BigNumber; asset: string; to: string },
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v2.BORROW),
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
export function aaveWithdraw(
  network: Network,
  args: { amount: BigNumber; asset: string; to: string },
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v2.WITHDRAW),
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
  network: Network,
  args: { asset: string; amount: BigNumber; paybackAll: boolean },
  paramsMapping: [asset: number, amount: number, paybackAll: number] = [0, 0, 0],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v2.PAYBACK),
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
