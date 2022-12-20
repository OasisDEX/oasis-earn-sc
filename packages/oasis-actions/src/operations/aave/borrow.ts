import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { ADDRESSES } from '../../helpers/addresses'
import { OPERATION_NAMES } from '../../helpers/constants'
import { Address } from '../../strategies/types/IPositionRepository'

export interface BorrowArgs {
  borrowToken: Address
  amount: BigNumber
  account: string
  user: string
  unwrap: boolean
}

export async function borrow({ borrowToken, amount, account, user, unwrap }: BorrowArgs) {
  const calls = [
    actions.aave.aaveBorrow({
      amount: amount,
      asset: borrowToken,
      to: account,
    }),
    actions.common.unwrapEth({
      amount: amount,
    }),
    actions.common.sendToken({
      amount: amount,
      asset: unwrap ? ADDRESSES.main.ETH : borrowToken,
      to: user,
    }),
  ]

  calls[1].skipped = !unwrap

  return {
    calls,
    operationName: OPERATION_NAMES.aave.BORROW,
  }
}
