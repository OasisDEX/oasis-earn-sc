import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { OPERATION_NAMES } from '../../helpers/constants'

export interface BorrowArgs {
  borrowToken: string
  amount: BigNumber
  account: string
}

export async function borrow({ borrowToken, amount, account }: BorrowArgs) {
  return {
    calls: [
      actions.aave.aaveBorrow({
        amount: amount,
        asset: borrowToken,
        to: account,
      }),
      actions.common.returnFunds({
        asset: borrowToken,
      }),
    ],
    operationName: OPERATION_NAMES.common.CUSTOM_OPERATION,
  }
}
