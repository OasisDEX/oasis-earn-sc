import { Swap } from '@dma-library/domain/Position'
import { SwapData } from '@dma-library/types/SwapData'
import { NULL_ADDRESS, TYPICAL_PRECISION, ZERO } from '@oasisdex/dma-common/constants'

export function getZeroSwap(sourceToken: string, targetToken: string): SwapData & Swap {
  return {
    sourceToken: {
      symbol: sourceToken,
      precision: TYPICAL_PRECISION,
    },
    targetToken: {
      symbol: targetToken,
      precision: TYPICAL_PRECISION,
    },
    fromTokenAddress: NULL_ADDRESS,
    toTokenAddress: NULL_ADDRESS,
    tokenFee: ZERO,
    collectFeeFrom: 'sourceToken',
    fromTokenAmount: ZERO,
    toTokenAmount: ZERO,
    minToTokenAmount: ZERO,
    exchangeCalldata: '',
  }
}
