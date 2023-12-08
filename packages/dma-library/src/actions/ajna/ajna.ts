import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { ZERO } from '@dma-common/constants'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { ActionCall, calldataTypes } from '@dma-library/types'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

export type AjnaDepositBorrowAction = (
  network: Network,
  args: {
    quoteToken: string
    collateralToken: string
    depositAmount: BigNumber
    borrowAmount?: BigNumber
    sumDepositAmounts: boolean
    price: BigNumber
  },
  paramsMapping: [
    quoteToken: number,
    collateralToken: number,
    depositAmount: number,
    borrowAmount: number,
    sumDepositAmounts: number,
    price: number,
  ],
) => ActionCall

export const ajnaDepositBorrow: AjnaDepositBorrowAction = (
  network: Network,
  args,
  paramsMapping = [0, 0, 0, 0, 0, 0],
) => {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)
  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.ajna.DEPOSIT_BORROW),
    [calldataTypes.ajna.DepositBorrow],
    [
      {
        quoteToken: args.quoteToken,
        collateralToken: args.collateralToken,
        depositAmount: args.depositAmount.toFixed(0),
        borrowAmount: args.borrowAmount?.toFixed(0) || ZERO.toFixed(0),
        sumDepositAmounts: args.sumDepositAmounts,
        price: args.price.toFixed(0),
      },
      paramsMapping,
    ],
  )
}

export type AjnaPaybackWithdrawAction = (
  network: Network,
  args: {
    quoteToken: string
    collateralToken: string
    withdrawAmount?: BigNumber
    paybackAmount?: BigNumber
    paybackAll?: boolean
    withdrawAll?: boolean
    price: BigNumber
  },
  paramsMapping?: [
    quoteToken: number,
    collateralToken: number,
    withdrawAmount: number,
    paybackAmount: number,
    paybackAll: number,
    withdrawAll: number,
    price: number,
  ],
) => ActionCall

export const ajnaPaybackWithdraw: AjnaPaybackWithdrawAction = (
  network: Network,
  args,
  paramsMapping = [0, 0, 0, 0, 0, 0, 0],
) => {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)
  const withdrawAmount = args.withdrawAmount?.toFixed(0) || ZERO.toFixed(0)
  const paybackAmount = args.paybackAmount?.toFixed(0) || ZERO.toFixed(0)
  return createAction(
    getActionHash(SERVICE_REGISTRY_NAMES.ajna.REPAY_WITHDRAW),
    [calldataTypes.ajna.RepayWithdraw],
    [
      {
        quoteToken: args.quoteToken,
        collateralToken: args.collateralToken,
        withdrawAmount,
        // Flagging different arg names here
        repayAmount: paybackAmount,
        paybackAll: !!args.paybackAll,
        withdrawAll: !!args.withdrawAll,
        price: args.price.toFixed(0),
      },
      paramsMapping,
    ],
  )
}
