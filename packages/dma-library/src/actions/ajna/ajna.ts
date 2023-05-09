import { ZERO } from '@dma-common/constants'
import { CONTRACT_NAMES } from '@dma-deployments/constants'
import { getActionHash } from '@dma-deployments/utils/action-hash'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { calldataTypes } from '@dma-library/types'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

export function ajnaDepositBorrow(
  args: {
    pool: string
    depositAmount: BigNumber
    borrowAmount?: BigNumber
    sumAmounts: boolean
    price: BigNumber
    setAsCollateral?: boolean
  },
  paramsMapping: [
    pool: number,
    depositAmount: number,
    borrowAmount: number,
    sumAmounts: number,
    price: number,
    setAsCollateral: number,
  ] = [0, 0, 0, 0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.ajna.DEPOSIT_BORROW),
    [calldataTypes.ajna.DepositBorrow],
    [
      {
        pool: args.pool,
        depositAmount: args.depositAmount.toFixed(0),
        borrowAmount: args.borrowAmount?.toFixed(0) || ZERO,
        sumAmounts: args.sumAmounts,
        price: args.price,
        setAsCollateral: args.setAsCollateral === undefined ? true : args.setAsCollateral,
      },
      paramsMapping,
    ],
  )
}

export function ajnaPaybackWithdraw(
  args: {
    pool: string
    paybackAmount?: BigNumber
    withdrawAmount?: BigNumber
    paybackAll?: boolean
    price: BigNumber
    to: string
  },
  paramsMapping: [
    pool: number,
    paybackAmount: number,
    withdrawAmount: number,
    price: number,
    paybackAll: number,
  ] = [0, 0, 0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.ajna.REPAY_WITHDRAW),
    [calldataTypes.ajna.RepayWithdraw],
    [
      {
        pool: args.pool,
        paybackAmount: args.paybackAmount?.toFixed(0) || ZERO,
        withdrawAmount: args.withdrawAmount?.toFixed(0) || ZERO,
        paybackAll: !!args.paybackAll,
        price: args.price,
        to: args.to,
      },
      paramsMapping,
    ],
  )
}
