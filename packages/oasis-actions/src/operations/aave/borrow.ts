import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { OPERATION_NAMES } from '../../helpers/constants'

export interface BorrowArgs {
  borrowToken: string
  amount: BigNumber
  account: string
  user: string
}

export async function borrow({ borrowToken, amount, account, user }: BorrowArgs) {
  return {
    calls: [
      actions.aave.aaveBorrow({
        amount: amount,
        asset: borrowToken,
        to: user,
      }),
      // actions.common.sendToken({
      //   amount: amount,
      //   asset: borrowToken,
      //   to: user,
      // })
    ],
    operationName: OPERATION_NAMES.aave.BORROW,
  }
}
