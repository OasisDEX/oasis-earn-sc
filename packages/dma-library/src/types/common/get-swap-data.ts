import { SwapData } from '@dma-library/types'
import BigNumber from 'bignumber.js'

/** __invertSwapDirection is only used in tests using 1inch mocks */
export interface GetSwapData {
  (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
    protocol?: string[],
    __invertSwapDirection?: boolean,
  ): Promise<SwapData>
}
