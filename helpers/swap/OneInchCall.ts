import BigNumber from 'bignumber.js'

import { one } from '../../scripts/common'
import { swapOneInchTokens } from './1inch'

export const getOneInchCall =
  (swapAddress: string, protocols?: string[], debug?: true) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const slippageAsPercentage = slippage.times(100).toString()
    if (debug) {
      console.log('1inch: Pre call')
      console.log('from:', from)
      console.log('to:', to)
      console.log('amount:', amount.toString())
      console.log('slippage', `${slippageAsPercentage.toString()}%`)
    }
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippageAsPercentage.toString(),
      protocols,
    )

    const minToTokenAmount = new BigNumber(response.toTokenAmount)
      .times(one.minus(slippage))
      .integerValue(BigNumber.ROUND_DOWN)

    if (debug) {
      console.log('1inch: Post call')
      console.log('fromTokenAmount', response?.fromTokenAmount.toString())
      console.log('toTokenAmount', response?.toTokenAmount.toString())
      console.log('minToTokenAmount', minToTokenAmount.toString())
    }

    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: minToTokenAmount,
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    }
  }