import { SwapData } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export interface GetSwapData {
  (fromToken: string, toToken: string, amount: BigNumber, slippage: BigNumber): Promise<SwapData>
}
