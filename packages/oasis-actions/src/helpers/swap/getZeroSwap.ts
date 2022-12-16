import { SwapData } from '../../strategies/types/SwapData'
import { Swap } from '../calculations/Position'
import { NULL_ADDRESS, TYPICAL_PRECISION, ZERO } from '../constants'

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
