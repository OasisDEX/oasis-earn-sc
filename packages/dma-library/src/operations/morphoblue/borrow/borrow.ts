import { getMorphoBlueBorrowOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Network } from '@deploy-configurations/types/network'
import { actions } from '@dma-library/actions'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { ActionCall, IOperation, MorphoBlueMarket } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export type MorphoBlueBorrowArgs = {
  morphoBlueMarket: MorphoBlueMarket
  amount: BigNumber
  isEthToken: boolean
}

export type MorphoBlueBorrowOperation = (
  args: MorphoBlueBorrowArgs,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) => Promise<IOperation>

export const borrow: MorphoBlueBorrowOperation = async (
  { morphoBlueMarket, amount, isEthToken },
  addresses,
  network,
) => {
  // Import ActionCall as it assists type generation
  const calls: ActionCall[] = [
    actions.morphoblue.borrow(network, {
      morphoBlueMarket: morphoBlueMarket,
      amount: amount,
    }),
    actions.common.unwrapEth(network, {
      amount: amount,
    }),
    actions.common.returnFunds(network, {
      asset: isEthToken ? addresses.tokens.ETH : morphoBlueMarket.loanToken,
    }),
  ]

  calls[1].skipped = !isEthToken

  return {
    calls,
    operationName: getMorphoBlueBorrowOperationDefinition(network).name,
  }
}
