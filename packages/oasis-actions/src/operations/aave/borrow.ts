import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { ADDRESSES } from '../../helpers/addresses'
import { OPERATION_NAMES } from '../../helpers/constants'
import { Address } from '../../strategies/types'

export interface BorrowArgs {
  borrowToken: Address
  amountInBaseUnit: BigNumber
  account: string
  user: string
  isEthToken: boolean
}

export async function borrow({
  borrowToken,
  amountInBaseUnit,
  account,
  user,
  isEthToken,
}: BorrowArgs) {
  const calls = [
    actions.aave.aaveBorrow({
      amount: amountInBaseUnit,
      asset: borrowToken,
      to: account,
    }),
    actions.common.unwrapEth({
      amount: amountInBaseUnit,
    }),
    actions.common.sendToken({
      amount: amountInBaseUnit,
      asset: isEthToken ? ADDRESSES.main.ETH : borrowToken,
      to: user,
    }),
  ]

  calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: OPERATION_NAMES.aave.BORROW,
  }
}
