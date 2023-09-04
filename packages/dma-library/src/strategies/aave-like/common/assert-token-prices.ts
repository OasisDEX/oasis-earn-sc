import { PriceResult } from '@dma-library/protocols/aave-like/types'
import BigNumber from 'bignumber.js'

export function assertTokenPrices(...tokenPrices: PriceResult[]) {
  for (const price of tokenPrices) {
    if (!price) {
      throw new Error('Could not get token prices')
    }
  }

  return tokenPrices as BigNumber[]
}
