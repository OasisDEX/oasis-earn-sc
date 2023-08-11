import { TYPICAL_PRECISION } from '@dma-common/constants'
import { CollectFeeFrom } from '@dma-common/types'
import { AAVETokens, SwapData } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export function buildSwap(
  swap: {
    data: SwapData
    fee: BigNumber
    collectFeeFrom: 'sourceToken' | 'targetToken'
  },
  entryToken: { symbol: AAVETokens },
  collateralToken: { symbol: AAVETokens },
  collectFeeFrom: CollectFeeFrom,
) {
  return {
    ...swap.data,
    tokenFee: swap.fee,
    collectFeeFrom,
    sourceToken: {
      symbol: entryToken?.symbol || '',
      precision: TYPICAL_PRECISION,
    },
    targetToken: {
      symbol: collateralToken.symbol,
      precision: TYPICAL_PRECISION,
    },
  }
}
