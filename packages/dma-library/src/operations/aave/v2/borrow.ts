import { OPERATION_NAMES } from '@dma-common/constants'
import { Address } from '@dma-common/types/address'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import { actions } from '@dma-library/actions'
import { ActionCall } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export interface BorrowArgs {
  borrowToken: Address
  amountInBaseUnit: BigNumber
  account: string
  user: string
  isEthToken: boolean
}

export async function borrow({ borrowToken, amountInBaseUnit, account, isEthToken }: BorrowArgs) {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
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
