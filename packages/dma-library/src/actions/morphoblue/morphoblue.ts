import { ADDRESS_ZERO, loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { Address } from '@dma-common/types'
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
        marketParams: {
          loanToken: args.morphoBlueMarket.loanToken,
          collateralToken: args.morphoBlueMarket.collateralToken,
          oracle: args.morphoBlueMarket.oracle,
          irm: args.morphoBlueMarket.irm,
          lltv: args.morphoBlueMarket.lltv.toFixed(0),
        },
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
        marketParams: {
          loanToken: args.morphoBlueMarket.loanToken,
          collateralToken: args.morphoBlueMarket.collateralToken,
          oracle: args.morphoBlueMarket.oracle,
          irm: args.morphoBlueMarket.irm,
          lltv: args.morphoBlueMarket.lltv.toFixed(0),
        },
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
        marketParams: {
          loanToken: args.morphoBlueMarket.loanToken,
          collateralToken: args.morphoBlueMarket.collateralToken,
          oracle: args.morphoBlueMarket.oracle,
          irm: args.morphoBlueMarket.irm,
          lltv: args.morphoBlueMarket.lltv.toFixed(0),
        },
        amount: args.amount.toFixed(0),
        to: args.to,
      },
    ],
  )
}

// Import ActionCall as it assists type generation
export function morphoBluePayback(
  network: Network,
  args: {
    morphoBlueMarket: MorphoBlueMarket
    amount: BigNumber
    onBehalf?: Address
  },
  paramsMapping: [amount: number] = [0],
): ActionCall {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.morphoblue.PAYBACK),
    [calldataTypes.morphoblue.Payback],
    [
      {
        marketParams: {
          loanToken: args.morphoBlueMarket.loanToken,
          collateralToken: args.morphoBlueMarket.collateralToken,
          oracle: args.morphoBlueMarket.oracle,
          irm: args.morphoBlueMarket.irm,
          lltv: args.morphoBlueMarket.lltv.toFixed(0),
        },
        amount: args.amount.toFixed(0),
        onBehalf: args.onBehalf ?? ADDRESS_ZERO,
      },
      paramsMapping,
    ],
  )
}
