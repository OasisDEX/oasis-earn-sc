import { ZERO } from '@dma-common/constants'
import { ActionFactory } from '@dma-library/actions/action-factory'
import { calldataTypes } from '@dma-library/types'
import { CONTRACT_NAMES } from '@oasisdex/dma-deployments/constants'
import { getActionHash } from '@oasisdex/dma-deployments/utils/action-hash'
import BigNumber from 'bignumber.js'

const createAction = ActionFactory.create

// TODO it's depends on contract interface and we will need to adjust it
export function ajnaDepositBorrow(
  args: {
    depositAsset: string
    borrowAsset: string
    depositAmount: BigNumber | 0
    borrowAmount?: BigNumber | 0
    to: string
    sumAmounts: boolean
    price: BigNumber
    setAsCollateral?: boolean
  },
  paramsMapping: [
    depositAsset: number,
    borrowAsset: number,
    depositAmount: number,
    borrowAmount: number,
    to: number,
    sumAmounts: number,
    price: number,
    setAsCollateral: number,
  ] = [0, 0, 0, 0, 0, 0, 0, 0],
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

// TODO it's not even touched for now in terms of interfaces
export function ajnaPaybackWithdraw(
  args: {
    withdrawAsset: string
    withdrawAmount: BigNumber
    paybackAmount?: BigNumber
    paybackAll?: boolean
    to: string
  },
  paramsMapping: [asset: number, amount: number, paybackAll: number] = [0, 0, 0],
) {
  return createAction(
    getActionHash(CONTRACT_NAMES.ajna.REPAY_WITHDRAW),
    [calldataTypes.ajna.RepayWithdraw],
    [
      {
        asset: args.asset,
        amount: args.amount.toFixed(0),
        paybackAll: args.paybackAll === undefined ? false : args.paybackAll,
      },
      paramsMapping,
    ],
  )
}
