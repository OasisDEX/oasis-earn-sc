import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { OPERATION_NAMES } from '@dma-common/constants'
import { Address } from '@dma-common/types/address'
import { actions } from '@dma-library/actions'
import { ActionCall, IOperation } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export interface BorrowArgs {
  borrowToken: Address
  amountInBaseUnit: BigNumber
  account: string
  user: string
  isEthToken: boolean
}

export type BorrowV3Operation = ({
  borrowToken,
  amountInBaseUnit,
  account,
  isEthToken,
}: BorrowArgs) => Promise<IOperation>

export const borrow: BorrowV3Operation = async ({
  borrowToken,
  amountInBaseUnit,
  account,
  isEthToken,
}) => {
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
