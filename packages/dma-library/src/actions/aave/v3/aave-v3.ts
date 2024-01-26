import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { ActionCall, calldataTypes } from '@dma-library/types'
import BigNumber from 'bignumber.js'
import { constants } from 'ethers'

const createAction = ActionFactory.create

// Import ActionCall as it assists type generation
export function aaveV3Deposit(
  network: Network,
  args: { asset: string; amount: BigNumber | 0; sumAmounts: boolean; setAsCollateral?: boolean },
  paramsMapping: [asset: number, amount: number, sumAmounts: number, setAsCollateral: number] = [
    0, 0, 0, 0,
  ],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.DEPOSIT),
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

// Import ActionCall as it assists type generation
export function aaveV3Borrow(
  network: Network,
  args: { amount: BigNumber; asset: string; to: string },
  paramsMapping: [amount: number, asset: number, to: number] = [0, 0, 0],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.BORROW),
    [calldataTypes.aaveV3.Borrow],
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
export function aaveV3Withdraw(
  network: Network,
  args: { amount: BigNumber; asset: string; to: string },
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW),
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
// Import ActionCall as it assists type generation
// Special Withdraw action that always takes amount from mapping

export function aaveV3WithdrawAuto(
  network: Network,
  args: { amount: BigNumber; asset: string; to: string },
  paramsMapping: [amount: number] = [0],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW_AUTO),
    [calldataTypes.aaveV3.Withdraw],
    [
      {
        asset: args.asset,
        amount: 0, // always taken from mapping
        to: args.to,
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function aaveV3Payback(
  network: Network,
  args: { asset: string; amount: BigNumber; paybackAll: boolean },
  paramsMapping: [asset: number, amount: number, paybackAll: number] = [0, 0, 0],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.PAYBACK),
    [calldataTypes.aaveV3.Payback],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        paybackAll: args.paybackAll,
        onBehalf: constants.AddressZero,
      },
      paramsMapping,
    ],
  )
}

// Import ActionCall as it assists type generation
export function aaveV3SetEMode(network: Network, args: { categoryId: number }): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.aave.v3.SET_EMODE),
    [calldataTypes.aaveV3.SetEMode],
    [
      {
        categoryId: args.categoryId,
      },
    ],
  )
}
