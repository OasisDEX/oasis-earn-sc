import { CONTRACT_NAMES } from '@deploy-configurations/constants'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { ZERO } from '@dma-common/constants'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { ActionCall, calldataTypes } from '@dma-library/types'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

export type AjnaDepositBorrowAction = (
  args: {
    pool: string
    depositAmount: BigNumber
    borrowAmount?: BigNumber
    sumDepositAmounts: boolean
    price: BigNumber
  },
  paramsMapping: [
    pool: number,
    depositAmount: number,
    borrowAmount: number,
    sumDepositAmounts: number,
    price: number,
  ],
) => ActionCall

export const ajnaDepositBorrow: AjnaDepositBorrowAction = (
  args,
  paramsMapping = [0, 0, 0, 0, 0],
) => {
  return createAction(
    getActionHash(CONTRACT_NAMES.ajna.DEPOSIT_BORROW),
    [calldataTypes.ajna.DepositBorrow],
    [
      {
        pool: args.pool,
        depositAmount: args.depositAmount.toFixed(0),
        borrowAmount: args.borrowAmount?.toFixed(0) || ZERO,
        sumDepositAmounts: args.sumDepositAmounts,
        price: args.price,
      },
      paramsMapping,
    ],
  )
}

export type AjnaPaybackWithdrawAction = (
  args: {
    pool: string
    withdrawAmount?: BigNumber
    paybackAmount?: BigNumber
    paybackAll?: boolean
    withdrawAll?: boolean
    price: BigNumber
  },
  paramsMapping?: [
    pool: number,
    withdrawAmount: number,
    paybackAmount: number,
    paybackAll: number,
    withdrawAll: number,
    price: number,
  ],
) => ActionCall

export const ajnaPaybackWithdraw: AjnaPaybackWithdrawAction = (
  args,
  paramsMapping = [0, 0, 0, 0, 0, 0],
) => {
  return createAction(
    getActionHash(CONTRACT_NAMES.ajna.REPAY_WITHDRAW),
    [calldataTypes.ajna.RepayWithdraw],
    [
      {
        pool: args.pool,
        withdrawAmount: args.withdrawAmount?.toFixed(0) || ZERO,
        paybackAmount: args.paybackAmount?.toFixed(0) || ZERO,
        paybackAll: !!args.paybackAll,
        withdrawAll: !!args.withdrawAll,
        price: args.price,
      },
      paramsMapping,
    ],
  )
}
