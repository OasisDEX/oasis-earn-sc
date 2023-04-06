import BigNumber from 'bignumber.js'

import * as actions from '@dma-library/actions'
import { ADDRESSES } from '@dma-library/utils/addresses'
import { OPERATION_NAMES } from '@dma-library/utils/constants'
import { Address } from '@dma-library/types'

export interface BorrowArgs {
  borrowToken: Address
  amountInBaseUnit: BigNumber
  account: string
  user: string
  isEthToken: boolean
}

export async function borrow({ borrowToken, amountInBaseUnit, account, isEthToken }: BorrowArgs) {
  const calls = [
    actions.aave.v2.aaveBorrow({
      amount: amountInBaseUnit,
      asset: borrowToken,
      to: account,
    }),
    actions.common.unwrapEth({
      amount: amountInBaseUnit,
    }),
    actions.common.returnFunds({
      asset: isEthToken ? ADDRESSES.main.ETH : borrowToken,
    }),
  ]

  calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: OPERATION_NAMES.aave.v2.BORROW,
  }
}
