import * as actions from '@dma-library/actions'
import { OPERATION_NAMES } from '@oasisdex/dma-common/constants'
import { Address } from '@oasisdex/dma-common/types/address'
import { ADDRESSES } from '@oasisdex/dma-deployments'
import { Network } from '@oasisdex/dma-deployments/types/network'
import BigNumber from 'bignumber.js'

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
      asset: isEthToken ? ADDRESSES[Network.MAINNET].common.ETH : borrowToken,
    }),
  ]

  calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: OPERATION_NAMES.aave.v2.BORROW,
  }
}
