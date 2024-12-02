import { getMorphoBlueBorrowOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { ActionCall, IOperation, MorphoBlueMarket } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { MorphoBlueStrategyAddresses } from '../addresses'
import { getReallocateToAction } from '../helpers/reallocate'

export type MorphoBlueBorrowArgs = {
  morphoBlueMarket: MorphoBlueMarket
  amountToBorrow: BigNumber
  isEthToken: boolean
  reallocateData: string[]
}

export type MorphoBlueBorrowOperation = (
  args: MorphoBlueBorrowArgs,
  addresses: MorphoBlueStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const borrow: MorphoBlueBorrowOperation = async (
  { morphoBlueMarket, amountToBorrow, isEthToken, reallocateData },
  addresses,
  network,
) => {
  const reallocate = getReallocateToAction(network, reallocateData)
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    reallocate,
    actions.morphoblue.borrow(network, {
      morphoBlueMarket: morphoBlueMarket,
      amount: amountToBorrow,
    }),
    actions.common.unwrapEth(network, {
      amount: amountToBorrow,
    }),
    actions.common.returnFunds(network, {
      asset: isEthToken ? addresses.tokens.ETH : morphoBlueMarket.loanToken,
    }),
  ]
  calls[2].skipped = !isEthToken

  return {
    calls,
    operationName: getMorphoBlueBorrowOperationDefinition(network).name,
  }
}
